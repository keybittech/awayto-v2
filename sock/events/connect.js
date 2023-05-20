import { sendBackchannel } from './backchannel.js';

export async function connect(sub, connectionId) {
  await sendBackchannel('connect', { sub, connectionId });
}