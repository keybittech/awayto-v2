import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { charCount } from '../util.js';
dotenv.config();
const {
  SOCK_SECRET,
  APP_HOST
} = process.env;

export async function sendBackchannel(path, body) {
  return await fetch(`https://${APP_HOST}/sock/${path}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-backchannel-id': SOCK_SECRET
    },
    body: JSON.stringify(body)
  });
}

export function checkBackchannel(auth) {
  const parsed = Buffer.from(auth.split(' ')[1], 'base64').toString();
  const match = parsed.slice(0, 5) === SOCK_SECRET.slice(0, 5);
  const length = parseInt(parsed.slice(5, parsed.length)) === charCount(SOCK_SECRET);
  return match && length;
}