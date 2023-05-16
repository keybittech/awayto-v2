import { sendBackChannel } from './backchannel.js';

export async function stale(connections) {
  await sendBackChannel('stale', connections);
}