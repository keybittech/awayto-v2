import { WebSocket } from 'ws';
import { exchangeHandler } from './exchange.js';
import redis from '../redis.js';
import { unsubscribe } from './unsubscribe.js';

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

      const existingUsers = await redis.sMembers(`member_topics:${parsed.topic}`); // get existing topic connections

      // send the existing user list to the joining connections
      if (existingUsers.length) {
        ws.send(Buffer.from(JSON.stringify({
          sender: ws.connectionId,
          type: 'existing-subscribers',
          topic: parsed.topic,
          payload: existingUsers.join(',')
        })));
      }

      await redis.sAdd(`connection_id:${ws.connectionId}:topics`, `member_topics:${parsed.topic}`); // track connection's overall topics
      await redis.sAdd(`member_topics:${parsed.topic}`, ws.connectionId); // track connection to just this topic
      await redis.expire(`member_topics:${parsed.topic}`, 86400); // Set expiration to 24 hours

      // Notify all other subscribers that a new user has joined the topic
      const notificationMessage = Buffer.from(JSON.stringify({
        store: true,
        sender: ws.connectionId,
        type: 'subscribe-topic',
        topic: parsed.topic,
        payload: ws.connectionId
      }));
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && (client.backchannel || client.subscriber.subscribedTopics.has(parsed.topic))) {
          client.send(notificationMessage);
        }
      });
    }
  } else if ('unsubscribe' === parsed.type) {
    await unsubscribe(wss, ws.connectionId, parsed.topic);
    ws.subscriber.subscribedTopics.delete(parsed.topic);
  } else if (parsed.topic) {
    // send messages as normal to topic-subscribed connections
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && (client.backchannel || client.subscriber.subscribedTopics.has(parsed.topic))) {
        client.send(message);
      }
    });
  }
}