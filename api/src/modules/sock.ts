import { WebSocket } from 'ws';

import { charCount } from 'awayto/core';

const {
  SOCK_HOST,
  SOCK_PORT,
  SOCK_SECRET
} = process.env as { [prop: string]: string };

async function go() {
  async function connect() {
    try {
      const ws = new WebSocket(`ws://${SOCK_HOST}:${SOCK_PORT}`, {
        auth: SOCK_SECRET.slice(0, 5) + charCount(SOCK_SECRET)
      });

      ws.onopen = () => {
        console.log('socket open');
      };

      ws.onmessage = event => {
        console.log({ event: event.data.toString() })
        const message = JSON.parse(event.data.toString())
      }
  
      ws.onclose = () => {
        console.log('socket closed. reconnecting...');
        setTimeout(() => {
          connect();
        }, 3000);
      };
  
      ws.onerror = error => {
        console.error("socket error:", error.message);
        ws.close();
      };
    } catch (error) {
      console.log('fatal sock error', error);
    }
  }

  await connect();
}

go();