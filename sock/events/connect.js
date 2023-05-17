import { sendBackChannel } from './backchannel.js';

export async function connect(sub, connectionId) {
  await sendBackChannel('connect', { sub, connectionId });
}