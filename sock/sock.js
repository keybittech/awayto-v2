import dotenv from 'dotenv';
dotenv.config();
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { v4 } from 'uuid';

import { handleSubscription, disconnect, stale } from './events/index.js';

import { createClient } from 'redis';

const redis = createClient({
  socket: {
    host: process.env.REDIS_HOST
  }
});

const socketId = process.env.SERVER_ID || 'websocket.0';
const serverUuid = v4();

await redis.connect();

// When the server starts up, add its id to redis
await redis.sAdd('socket_servers', serverUuid);

// Every 5 seconds, heartbeat id to redis
setInterval(async function() {
  await redis.incr(`socket_servers:${serverUuid}:heartbeat`);
  await redis.expire(`socket_servers:${serverUuid}:heartbeat`, 10);
}, 5000);

// If this is the first socket server running
if ('websocket.0' === socketId) {
  setInterval(async function() {
    // Check all socket servers
    const servers = await redis.sMembers('socket_servers');
    for (const servUuid of servers) {

      // If no heartbeat, remove stale connections
      const hbCount = await redis.get(`socket_servers:${servUuid}:heartbeat`);
      if (!hbCount) {
        const staleConnections = await redis.sMembers(`socket_servers:${servUuid}:connections`);
        if (staleConnections.length) {
          await stale(staleConnections);
        }
        await redis.sRem('socket_servers', servUuid);
      }
    }
  }, 5 * 60 * 1000);
}

// Storage for connected members
const subscribers = [];

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
      
      let body = '';

      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', () => {
        if (req.url.includes('create_ticket')) {

          try {
            const sub = req.url.split('/')[2];
            const subscriber = subscribers.find(s => s.sub === sub);
            const ticket = `${v4()}:${v4()}`
            const parsed = JSON.parse(body || '{}');

            if (subscriber) {
              subscriber.tickets.push(ticket);
              subscriber.allowances = { ...parsed };
            } else {
              subscribers.push({
                sub,
                connectionIds: [],
                allowances: { ...parsed },
                tickets: [ticket],
                subscribedTopics: new Set()
              });
            }

            res.writeHead(200);
            res.write(ticket);
            res.end();
          } catch (error) {
            console.error('issue handling ticket assignment', error)
          }
        }
      })

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
    const [auth, connectionId] = req.url.slice(1).split(':');

    let authIndex = -1;
    
    const subscriber = subscribers.find(s => {
      authIndex = s.tickets.indexOf(`${auth}:${connectionId}`);
      return authIndex > -1;
    });

    if (authIndex > -1) {
      subscriber.tickets.shift();
      wss.handleUpgrade(req, socket, head, async ws => {
        subscriber.connectionIds.push(connectionId);
        ws.subscriber = subscriber;
        ws.connectionId = connectionId;
        await redis.sAdd(`socket_servers:${serverUuid}:connections`, `${subscriber.sub}:${connectionId}`);
        wss.emit('connection', ws, req);
      });

    } else {
      socket401(socket);
    }
  } catch (error) {
    console.log(error)
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
  ws.isAlive = true;

  // Remove any active processes and server refs on close
  ws.on('close', async function () {
    await cleanUp(ws);
  });

  // When we receive a ping from client, this will flag it alive on the server for another 30 seconds
  ws.on('pong', function () {
    ws.isAlive = true;
  });

  // Handle incoming messages
  ws.on('message', function (message) {
    try {
      handleSubscription(wss, ws, message);
    } catch (error) {
      console.log('Critical Error: couldn\'t process socket message', message.toString(), error);
    }
  });
});

async function cleanUp(ws) {
  try {
    // Remove connection from db
    await disconnect(ws);

    // remove from socket server connection cache
    await redis.sRem(`socket_servers:${serverUuid}:connections`, `${ws.subscriber.sub}:${ws.connectionId}`);

    // remove local references
    if (0 === ws.subscriber.connectionIds.length) {
      const subIndex = subscribers.findIndex(s => s.sub === ws.subscriber.sub);
      if (subIndex > -1) {
        subscribers.splice(subIndex, 1);
      }
    }

    console.log('activity', ws.connectionId, 'closed connection.');
  } catch (error) {
    console.log('clean up error', error);
  }
}

// Every 30 secs, ping clients, or clean up
const interval = setInterval(function ping() {
  wss.clients.forEach(async function (ws) {
    if (ws.isAlive === false) {
      await cleanUp(ws);
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