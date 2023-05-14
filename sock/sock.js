import { createServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { v4 } from 'uuid';

// Storage for connected members
const pendingTickets = {};
const connections = {};
const allowances = {};

// Start a generic http server
const server = createServer().listen(8080);

// Start a generic wss server without an internal server
const wss = new WebSocketServer({ noServer: true });

// Catch any request coming into the http server for inter-socket connectivity
// Define connection endpoints between containers where needed here
server.on('request', function (req, res) {

  if ('POST' === req.method) {

    // User wants to get a ticket to open a socket
    // Proxied from front end through api for kc auth check
    // Create a temporary ticket that the host can use to create a socket later
    try {
      const host = req.headers['x-forwarded-for'].split(', ')[0];
      const authorization = req.headers['authorization'];

      if (!authorization) {
        res.writeHead(401);
      } else {

        let body = '';

        req.on('data', chunk => {
          body += chunk.toString();
        });

        req.on('end', () => {
          if (req.url.includes('create_ticket')) {

            try {
              const id = v4();
              const parsed = JSON.parse(body || '{}');

              allowances[id] = { ...parsed };

              const hostTix = pendingTickets[host] = pendingTickets[host] || {};
              hostTix.tickets = hostTix.tickets || [];
              hostTix.tickets.push(authorization);
              res.writeHead(200);
              res.write(id);
              res.end();
            } catch (error) {
              console.error('issue handling ticket assignment')
            }
          }
        })
      }

    } catch (error) {
      console.log('Critical Error', error);
      res.writeHead(500);
    }

  } else {
    res.writeHead(404);
  }
})

// Proxy pass from nginx sets http upgrade request, caught here
server.on('upgrade', async function (req, socket, head) {
  try {
    const host = req.headers['x-forwarded-for'].split(', ')[0];

    // Check if the host has any tickets and open a socket
    if (pendingTickets[host]) {

      // request comes as /ndsjfs which is client generated id
      const ticket = pendingTickets[host].tickets.shift();

      // If handshake was successful
      if (ticket) {
        const localId = req.url.slice(1);
        wss.handleUpgrade(req, socket, head, function (ws) {
          ws.localId = localId;
          wss.emit('connection', ws, req);
        });
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
  ws.subscribedTopics = new Set();
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

      if ('subscribe' === parsed.type) {
        ws.subscribedTopics.add(parsed.topic);
      } else if ('unsubscribe' === parsed.type) {
        ws.subscribedTopics.delete(parsed.topic);
      } else if (parsed.topic) {
        wss.clients.forEach(ws => {
          if (ws.readyState === WebSocket.OPEN && ws.subscribedTopics && ws.subscribedTopics.has(parsed.topic)) {
            ws.send(message);
          }
        });
      }
    } catch (error) {
      console.log('Critical Error: couldn\'t process socket message', message.toString(), error);
    }
  });

  // Notify
  ws.send(Buffer.from(JSON.stringify({
    status: 'connected'
  })));
});

function cleanUp(ws) {
  try {
    delete allowances[ws.localId];
    delete connections[ws.localId];

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