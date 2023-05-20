import { sendBackchannel } from './backchannel.js';

export async function stale(connections) {
  await sendBackchannel('stale', connections);
}