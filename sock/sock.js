import { createServer } from 'http';
import { v4 } from 'uuid';

import redis, { serverUuid } from './redis.js';
import wss, { subscribers } from './wss.js';
import { connect } from './events/connect.js';
import { checkBackchannel } from './events/backchannel.js';

// Start a generic http server
const server = createServer().listen(8080);

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
            const ticket = `${v4()}:${v4()}`
            const parsed = JSON.parse(body || '{}');
            const sub = req.url.split('/')[2];
            let subscriber = subscribers.find(s => s.sub === sub);
            
            if (subscriber) {
              subscriber.tickets.push(ticket);
              subscriber.allowances = { ...parsed };
            } else {
              subscriber = {
                sub,
                connectionIds: [],
                allowances: { ...parsed },
                tickets: [ticket],
                subscribedTopics: new Set()
              };
              subscribers.push(subscriber);
            }

            res.writeHead(200);
            res.write(ticket);
            res.end();

            setTimeout(() => {
              subscriber.tickets.splice(subscriber.tickets.indexOf(ticket), 1);
            }, 2000);
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
    const ticket = req.url.slice(1); // <auth>:<connectionID>
    const connectionId = ticket.split(':')[1];

    let ticketIndex = -1;
    
    const subscriber = subscribers.find(s => {
      ticketIndex = s.tickets.indexOf(ticket);
      return ticketIndex > -1;
    });

    if (ticketIndex > -1) {
      subscriber.tickets.splice(ticketIndex, 1);
      wss.handleUpgrade(req, socket, head, async ws => {
        // subscriber holds all the user's allowed topics for the connected context
        ws.subscriber = subscriber;
        // a connection id is the primary point of contact for a user's event stream
        // could be multiple browser tabs, etc, all tied to the same sub
        ws.connectionId = connectionId;
        subscriber.connectionIds.push(connectionId);

        // send a request to the db to establish a sock_connection
        await connect(subscriber.sub, connectionId);

        // assign this connection id to this server's connections
        await redis.sAdd(`socket_servers:${serverUuid}:connections`, `${subscriber.sub}:${connectionId}`);

        wss.emit('connection', ws, req);
      });

    } else if (checkBackchannel(req.headers['authorization'])) {
      wss.handleUpgrade(req, socket, head, async ws => {
        ws.backchannel = true;
        wss.backchannel = ws;
        wss.emit('connection', ws, req);
      });
    } else {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  } catch (error) {
    console.log(error)
    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    socket.destroy();
  }
});

console.log('WebSocket Server Initialized.')