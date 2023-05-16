import { WebSocket } from 'ws';

export function handleSubscription(wss, ws, message) {
  const parsed = JSON.parse(message.toString());
  // Parsed will have a sender, topic and type, might have a message or other

  const [topic, handle] = parsed.topic.split(':');
  
  if ('subscribe' === parsed.type) {
    if ('exchange' === topic && ws.subscriber.allowances.bookings.includes(handle)) {
      ws.subscriber.subscribedTopics.add(parsed.topic);
    }
  } else if ('unsubscribe' === parsed.type) {
    ws.subscriber.subscribedTopics.delete(parsed.topic);
  } else if (parsed.topic) {
    wss.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN && ws.subscriber.subscribedTopics.has(parsed.topic)) {
        console.log('sending message', parsed);
        ws.send(message);
      }
    });
  }
}