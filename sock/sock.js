import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';
import { v4 } from 'uuid';
import Keycloak from 'keycloak-connect';
import request from 'request';
import util from 'util';

// Setup keycloak
const keycloakConfig = {
  clientId: 'devel-client',
  bearerOnly: true,
  serverUrl: 'https://192.168.1.53:8443',
  realm: 'devel',
  grantType: 'client_credentials'
}

// Storage for connected members
const pendingTickets = {};
const connections = {};

// Start a generic http server
const server = createServer().listen(8080);

// Start a generic wss server without an internal server
const wss = new WebSocketServer({ noServer: true });

// Catch any request coming into the http server for inter-socket connectivity
// Define connection endpoints between containers where needed here
server.on('request', function (req, res) {

  if ('POST' === req.method) {

    // Standard body parsing for this http framework
    let body = ''

    req.on('data', function (chunk) {
      body += chunk.toString();
    });

    req.on('end', function () {
      // User wants to get a ticket to open a socket
      // Proxied from front end through api for kc auth check
      // Create a temporary ticket that the host can use to create a socket later
      if ('/create_ticket/' === req.url) {
        const host = req.headers['x-forwarded-for'];
        const { localId } = JSON.parse(body);
        const hostTix = pendingTickets[host] = pendingTickets[host] || {};
        hostTix.tickets = hostTix.tickets || [];
        hostTix.tickets.push(localId);
      }
      res.writeHead(200);
      res.end();
    })

  } else {
    res.writeHead(404);
    res.end();
  }
})

// Proxy pass from nginx sets http upgrade request, caught here
server.on('upgrade', function (req, socket, head) {
  console.log(' got an upgrade request', req.url, util.inspect(req.headers));

  try {
    const host = req.headers['x-forwarded-for'];

    // Check if the host has any tickets and open a socket
    if (pendingTickets[host]) {

      // request comes as /ndsjfs which is client generated id
      const localId = req.url.slice(1);
      const ticket = pendingTickets[host].tickets.indexOf(localId);

      if (-1 < ticket) {
        // If the host has a ticket, expire it
        pendingTickets[host].tickets.splice(ticket);

        // Upgrade the socket request
        wss.handleUpgrade(req, socket, head, function (ws) {
          ws.localId = localId;
          wss.emit('connection', ws, req);
          console.log('activity', host, localId, 'started a socket connection', ws.id);
        });
      } else {
        // Otherwise there is no ticket, no auth
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
      }
    }
  } catch (error) {
    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    socket.destroy();
  }
});



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