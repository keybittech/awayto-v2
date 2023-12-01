import { WebSocket } from 'ws';
import redis from '../redis.js';

export async function unsubscribe(wss, connectionId, topic) {
  const notificationMessage = Buffer.from(JSON.stringify({
    sender: connectionId,
    action: 'unsubscribe-topic',
    topic,
    payload: connectionId
  }));

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && (client.backchannel || client.subscriber.subscribedTopics.has(topic))) {
      client.send(notificationMessage);
    }
  });

  await redis.sRem(`member_topics:${topic}`, connectionId); // remove this connection from just this topic
  await redis.sRem(`connection_id:${connectionId}:topics`, `member_topics:${topic}`); // remove the topic from the connection's topic list
}

      
