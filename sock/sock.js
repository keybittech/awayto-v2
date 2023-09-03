import { createServer } from 'http';
import { v4 } from 'uuid';

import redis, { serverUuid } from './redis.js';
import wss, { subscribers } from './wss.js';
import { connect } from './events/connect.js';
import { checkBackchannel } from './events/backchannel.js';

// Start a generic http server
const server = createServer().listen(8888);

// Catch any request coming into the http server for inter-socket connectivity
// Define connection endpoints between containers where needed here
server.on('request', function (req, res) {
  if ('POST' === req.method && req.headers['x-backchannel-id'] && checkBackchannel(req.headers['x-backchannel-id'])) {

    // User wants to get a ticket to open a socket
    // Proxied from front end through api for kc auth check
    // Create a temporary ticket that the host can use to create a socket later
    try {
      if (req.url.includes('create_ticket')) {

        console.log('creating ticket', req.url);
        try {
          const auth = v4();
          const connectionId = v4();
          const ticket = `${auth}:${connectionId}`
          const sub = req.url.split('/')[2];
          let subscriber = subscribers.find(s => s.sub === sub);
          
          if (subscriber) {
            Object.assign(subscriber.tickets, { [auth]: connectionId });
            console.log('pushed ticket', subscriber.tickets);
          } else {
            subscriber = {
              sub,
              connectionIds: [],
              tickets: { [auth]: connectionId },
              subscribedTopics: new Set()
            };
            subscribers.push(subscriber);
          }

          res.writeHead(200);
          res.write(ticket);
          res.end();

          console.log('ended ticket')

          setTimeout(() => {
            console.log('splicing old ticket', ticket)
            delete subscriber.tickets[auth];
          }, 15000);
        } catch (error) {
          console.error('issue handling ticket assignment', error)
        }
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
  console.log('upgrading');
  try {
    const ticket = req.url.slice(1); // <auth>:<connectionID>
    const [auth, connectionId] = ticket.split(':');

    console.log('connecting a new user with current # of users', subscribers.length, ticket);
    
    const subscriber = subscribers.find(s => {
      console.log(s, auth)
      return s.tickets.hasOwnProperty(auth);
    });

    console.log('found sub', subscriber);

    if (subscriber) {
      delete subscriber.tickets[auth];
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

    } else if (req.headers['x-backchannel-id'] && checkBackchannel(req.headers['x-backchannel-id'])) {
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