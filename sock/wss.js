import { WebSocketServer } from 'ws';
import { handleSubscription, unsubscribe } from './events/index.js';
import { handleUnsubRedis } from './redis.js';

// Storage for connected members
export const subscribers = [];

// Start a generic wss server without an internal server
const wss = new WebSocketServer({ noServer: true });

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
  ws.on('message', async function (message) {
    try {
      await handleSubscription(wss, ws, message);
    } catch (error) {
      console.log('Critical Error: couldn\'t process socket message', message.toString(), error);
    }
  });
});

async function cleanUp(ws) {
  try {
    if (ws.subscriber) {
      ws.subscriber.connectionIds.splice(ws.subscriber.connectionIds.indexOf(ws.connectionId));

      // remove local references
      if (!ws.subscriber.connectionIds.length) {
        const subIndex = subscribers.findIndex(s => s.sub === ws.subscriber.sub);
        if (subIndex > -1) {
          subscribers.splice(subIndex, 1);
        }
      }
  
      for (const topic of await handleUnsubRedis([`${ws.subscriber.sub}:${ws.connectionId}`])) {
        await unsubscribe(wss, ws.connectionId, topic);
      }
  
      console.log('activity', ws.connectionId, 'closed connection.');
    }
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

export default wss;