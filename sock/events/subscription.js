import { WebSocket } from 'ws';
import { exchangeHandler } from './exchange.js';
import redis from '../redis.js';

const handlers = [
  exchangeHandler
];

export async function handleSubscription(wss, ws, message) {
  const parsed = JSON.parse(message.toString());
  // Parsed will have a sender, topic and type, might have a message or other
  
  if ('subscribe' === parsed.type) {
    let subbed = false;

    for (let i = 0; i < handlers.length; i++) { 
      const handler = handlers[i];
      subbed = handler(ws, parsed);
      if (subbed) break;
    }

    if (subbed) {
      ws.subscriber.subscribedTopics.add(parsed.topic);

      const existingUsers = await redis.sMembers(`exchanges:${parsed.topic}`); // get existing topic connectionss
      // send the existing user list to the joining connections
      ws.send(Buffer.from(JSON.stringify({
        sender: ws.connectionId,
        type: 'join-topic',
        topic: parsed.topic,
        payload: existingUsers
      })));

      await redis.sAdd(`connection_id:${ws.connectionId}:topics`, `exchanges:${parsed.topic}`); // track connection's overall topics
      await redis.sAdd(`exchanges:${parsed.topic}`, ws.connectionId); // track connection to just this topic
      await redis.expire(`exchanges:${parsed.topic}`, 86400); // Set expiration to 24 hours

      // Notify all other subscribers that a new user has joined the topic
      const notificationMessage = Buffer.from(JSON.stringify({
        sender: ws.connectionId,
        type: 'join-topic',
        topic: parsed.topic,
        payload: ws.connectionId
      }));
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.subscriber.subscribedTopics.has(parsed.topic)) {
          client.send(notificationMessage);
        }
      });
    }
  } else if ('unsubscribe' === parsed.type) {
    await redis.sRem(`exchanges:${parsed.topic}`, ws.connectionId); // remove this connection from just this topic
    await redis.sRem(`connection_id:${ws.connectionId}:topics`, `exchanges:${parsed.topic}`); // remove the topic from the connection's topic list
    ws.subscriber.subscribedTopics.delete(parsed.topic);
  } else if (parsed.topic) {
    // send messages as normal to topic-subscribed connections
    wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN && ws.subscriber.subscribedTopics.has(parsed.topic)) {
        ws.send(message);
      }
    });
  }
  
}