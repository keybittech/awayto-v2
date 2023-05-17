import { WebSocket } from 'ws';
import { exchangeHandler } from './exchange.js';

const handlers = [
  exchangeHandler
];

export function handleSubscription(wss, ws, message) {
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
      // Notify all other subscribers that a new user has joined the topic
      const notificationMessage = Buffer.from(JSON.stringify({
        sender: ws.connectionId,
        type: 'join-topic',
        topic: parsed.topic
      }));
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN && client.subscriber.subscribedTopics.has(parsed.topic)) {
          client.send(notificationMessage);
        }
      });
    }
  } else if ('unsubscribe' === parsed.type) {
    ws.subscriber.subscribedTopics.delete(parsed.topic);
  } else if (parsed.topic) {
    wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN && ws.subscriber.subscribedTopics.has(parsed.topic)) {
        ws.send(message);
      }
    });
  }
}