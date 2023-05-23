import { WebSocket } from 'ws';
import { unsubscribe } from './unsubscribe.js';
import { subscribe } from './subscribe.js';

export async function handleSubscription(wss, ws, message) {
  const parsed = JSON.parse(message.toString());
  // Parsed will have a sender, topic and type, might have a message or other
  
  if ('subscribe' === parsed.type) {
    await subscribe(wss.backchannel, parsed, ws);
  } else if ('load-messages' === parsed.type) {
    if (ws.subscriber.subscribedTopics.has(parsed.topic)) {
      wss.backchannel.send(Buffer.from(JSON.stringify({
        sender: ws.connectionId,
        type: 'load-messages',
        topic: parsed.topic
      })));
    }
  } else if ('unsubscribe' === parsed.type) {
    await unsubscribe(wss, ws.connectionId, parsed.topic);
    ws.subscriber.subscribedTopics.delete(parsed.topic);
  } else if (ws.backchannel && parsed.target) {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.connectionId == parsed.target) {
        client.send(Buffer.from(JSON.stringify(parsed.payload)));
      }
    });
  } else if (parsed.topic) {
    // send messages as normal to topic-subscribed connections
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && !client.backchannel && client.subscriber.subscribedTopics.has(parsed.topic)) {
        client.send(message);
      }
    });
  }

  if (ws.subscriber && ws.subscriber.subscribedTopics.has(parsed.topic) && parsed.store) {
    wss.backchannel.send(message);
  }
}