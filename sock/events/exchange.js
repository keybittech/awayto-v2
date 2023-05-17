export const exchangeHandler = (ws, parsed) => {

  const [topic, handle] = parsed.topic.split(':');

  switch(topic) {
    case 'exchange':
      if (ws.subscriber.allowances.bookings.includes(handle)) {
        return true;
      }
      return false;
    default:
      return false;
  }
}