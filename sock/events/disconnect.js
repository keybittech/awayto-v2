import { sendBackChannel } from './backchannel.js';

export async function disconnect(ws) {

  const res = await sendBackChannel('disconnect', { sub: ws.subscriber.sub, connectionId: ws.connectionId })

  if (res.ok) {
    ws.subscriber.connectionIds.splice(ws.subscriber.connectionIds.indexOf(ws.connectionId));
  }
}