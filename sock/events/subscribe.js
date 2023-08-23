
import redis from '../redis.js';
import { exchangeHandler } from './exchange.js';
import { allowances } from './allowances.js';

const handlers = [
  exchangeHandler
];

export async function subscribe(bc, parsed, ws) {
  
  let subbed = false;

  ws.subscriber.allowances = { ...await allowances(ws.subscriber.sub) };

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
      bc.send(Buffer.from(JSON.stringify({
        sender: ws.connectionId,
        type: 'existing-subscribers',
        topic: parsed.topic,
        payload: existingUsers.join(',')
      })));
    }

    await redis.sAdd(`connection_id:${ws.connectionId}:topics`, `member_topics:${parsed.topic}`); // track connection's overall topics
    await redis.sAdd(`member_topics:${parsed.topic}`, ws.connectionId); // track connection to just this topic
    await redis.expire(`member_topics:${parsed.topic}`, 86400); // Set expiration to 24 hours

    bc.send(Buffer.from(JSON.stringify({
      sender: ws.connectionId,
      type: 'subscribe-topic',
      topic: parsed.topic,
      payload: ws.connectionId
    })));
  }
}