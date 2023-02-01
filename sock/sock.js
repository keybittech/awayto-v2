import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { v4 } from 'uuid';
import util, { inspect } from 'util';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// Storage for connected members
const pendingTickets = {};
const connections = {};

// Start a generic http server
const server = createServer().listen(8080);

// Start a generic wss server without an internal server
const wss = new WebSocketServer({ noServer: true });

async function jwtVerify(token, secretOrPublicKey) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

const authClient = jwksClient({
  jwksUri: `https://192.168.0.3:8443/auth/realms/${process.env.KC_REALM}/protocol/openid-connect/certs`
});

function getKey(header, callback) {
  authClient.getSigningKey(header.kid, (err, key) => {
    console.log({ err, key })
    if (err) {
      callback(err);
    } else {
      const signingKey = key.publicKey || key.rsaPublicKey;
      callback(null, signingKey);
    }
  })
}


// Catch any request coming into the http server for inter-socket connectivity
// Define connection endpoints between containers where needed here
server.on('request', function (req, res) {

  if ('GET' === req.method) {

    // User wants to get a ticket to open a socket
    // Proxied from front end through api for kc auth check
    // Create a temporary ticket that the host can use to create a socket later
    try {

      console.log('got a ticket creator', util.inspect(req), util.inspect(req.headers))

      if (req.url.includes('create_ticket')) {
        const host = req.headers['x-forwarded-for'].split(', ')[0];
        const authorization = req.headers['authorization'];

        if (!authorization) {
          res.writeHead(401);
        } else {
          const hostTix = pendingTickets[host] = pendingTickets[host] || {};
          hostTix.tickets = hostTix.tickets || [];
          hostTix.tickets.push(authorization);
          res.writeHead(200);
        }

      }

    } catch (error) {
      console.log('Critical Error', error);
      res.writeHead(500);
    }

  } else {
    res.writeHead(404);
  }
  res.end();
})

// Proxy pass from nginx sets http upgrade request, caught here
server.on('upgrade', async function (req, socket, head) {
  console.log(' got an upgrade request', req.url, util.inspect(req.headers), util.inspect(pendingTickets));

  try {
    const host = req.headers['x-forwarded-for'].split(', ')[0];

    // Check if the host has any tickets and open a socket
    if (pendingTickets[host]) {

      // request comes as /ndsjfs which is client generated id
      const ticket = pendingTickets[host].tickets.shift();

      // If handshake was successful
      if (ticket) {

        // Verify the ticket and get its token
        // const token = await jwtVerify(ticket, getKey);

        // console.log('got a token', { token })

        // if (token.realm_access) {
          // Upgrade the socket request
          const localId = req.url.slice(1);
          wss.handleUpgrade(req, socket, head, function (ws) {
            ws.localId = localId;
            wss.emit('connection', ws, req);
            console.log('activity', host, localId, 'started a socket connection', ws.id);
          });
        // } else {
        //   socket401(socket);
        // }
      } else {
        socket401(socket);
      }


    }
  } catch (error) {
    socket500(socket);
  }
});

function socket500(socket) {
  socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
  socket.destroy();
}

function socket401(socket) {
  socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
  socket.destroy();
}

wss.on('connection', function (ws, req) {
  // Setup socket info and attach to server
  ws.id = v4();
  ws.isAlive = true;
  connections[ws.localId] = ws;

  // Remove any active processes and server refs on close
  ws.on('close', function () {
    cleanUp(ws);
  });

  // When we receive a ping from client, this will flag it alive on the server for another 30 seconds
  ws.on('pong', function () {
    ws.isAlive = true;
  });

  // Handle incoming messages
  ws.on('message', function (message) {
    try {
      // Messages will have a sender and type, might have a message or other
      const parsed = JSON.parse(message.toString());
      const localIdBuffer = Buffer.from(ws.localId);

      if ('text' === parsed.type) {

        if (parsed.target) {
          // p2p messaging
          dm(parsed.target, Buffer.concat([localIdBuffer, message]));
        } else {
          // For generic text messages, send to all participants for now
          wss.clients.forEach(function (ws) {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(message);
            }
          });
        }
      } else if (parsed.rtc) { // WebRTC catchall
        if (parsed.target) {
          dm(parsed.target, message);
        } else {
          // Handles join-call
          wss.clients.forEach(function (ws) {
            if (ws.localId !== parsed.sender && ws.readyState === WebSocket.OPEN) {
              ws.send(message);
            }
          });
        }

      }

    } catch (error) {
      console.log('Critical Error: couldn\'t process socket message', util.inspect(message), error);
    }
  });

  // Notify
  ws.send(Buffer.from(JSON.stringify({
    status: 'connected'
  })));
});

function dm(target, message) {
  const ws = connections[target];
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(message);
  }
}

function cleanUp(ws) {
  try {
    // Remove from connection pool
    const pos = connections[ws.localId];
    if (-1 < pos) {
      console.log('removing connection');
      connections.splice(pos);
    }

    // Notify
    console.log('activity', ws.id, 'closed connection.');
  } catch (error) {

  }
}

// Every 30 secs, ping clients, or clean up
const interval = setInterval(function ping() {
  wss.clients.forEach(function (ws) {
    if (ws.isAlive === false) {
      cleanUp(ws);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', function close() {
  clearInterval(interval);
});

console.log('WebSocket Server Initialized.')