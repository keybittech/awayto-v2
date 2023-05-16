export * from './disconnect.js';
export * from './stale.js';

export function handleSubscription(ws, parsed) {
  if ('subscribe' === parsed.type) {
    ws.subscriber.subscribedTopics.add(parsed.topic);
  } else if ('unsubscribe' === parsed.type) {
    ws.subscriber.subscribedTopics.delete(parsed.topic);
  }
}