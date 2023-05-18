import { WebSocket } from 'ws';
import redis from '../redis.js';

export async function unsubscribe(wss, connectionId, topic) {
  const notificationMessage = Buffer.from(JSON.stringify({
    sender: connectionId,
    type: 'unsubscribe-topic',
    topic,
    payload: connectionId
  }));

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && client.subscriber.subscribedTopics.has(topic)) {
      client.send(notificationMessage);
    }
  });

  await redis.sRem(`exchanges:${topic}`, connectionId); // remove this connection from just this topic
  await redis.sRem(`connection_id:${connectionId}:topics`, `exchanges:${topic}`); // remove the topic from the connection's topic list
}

      