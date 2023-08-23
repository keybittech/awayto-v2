import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { charCount } from '../util.js';
dotenv.config();
const {
  SOCK_SECRET,
  API_HOST
} = process.env;

export async function sendBackchannel(path, body) {
  return await fetch(`https://${API_HOST}/sock/${path}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-backchannel-id': SOCK_SECRET
    },
    body: JSON.stringify(body)
  });
}

export function checkBackchannel(auth) {
  const match = auth.slice(0, 5) === SOCK_SECRET.slice(0, 5);
  const length = parseInt(auth.slice(5, auth.length)) === charCount(SOCK_SECRET);
  return match && length;
}