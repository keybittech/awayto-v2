import { sendBackchannel } from './backchannel.js';

export async function allowances(sub) {
  const res = await sendBackchannel('allowances', { sub });
  const { allowances } = await res.json();
  return allowances;
}