export const exchangeHandler = (ws, parsed) => {

  const [topic, handle] = parsed.topic.split(':');

  switch(topic) {
    case 'exchange/text':
    case 'exchange/call':
    case 'exchange/whiteboard':
      return ws.subscriber.allowances.bookings.includes(handle);
    default:
      return false;
  }
}