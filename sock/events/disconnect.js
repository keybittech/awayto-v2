import { sendBackChannel } from './backchannel.js';

export async function disconnect(ws) {
  try {
    await sendBackChannel('disconnect', { sub: ws.subscriber.sub, connectionId: ws.connectionId })
  } catch (error) { }

  ws.subscriber.connectionIds.splice(ws.subscriber.connectionIds.indexOf(ws.connectionId));
}