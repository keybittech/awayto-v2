import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
const {
  SOCK_SECRET,
  KC_API_HOST
} = process.env;

export async function sendBackChannel(path, body) {
  return await fetch(`https://${KC_API_HOST}/sock/${path}/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-backchannel-id': SOCK_SECRET
    },
    body: JSON.stringify(body)
  });
}