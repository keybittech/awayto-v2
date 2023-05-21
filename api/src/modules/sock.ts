import { WebSocket } from 'ws';

import { SocketResponse, charCount } from 'awayto/core';
import { db } from './db';

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

      ws.onmessage = async ({ data }) => {
        const { store, ...message } = JSON.parse(data.toString()) as SocketResponse<unknown>;
        console.log({ message });
        if (store) {

          if ('subscribe-topic' === message.type) {
            const messages = await db.manyOrNone<{ message: SocketResponse<unknown> }>(`
              SELECT message
              FROM dbtable_schema.topic_messages
              WHERE topic = $1
            `, [message.topic]);
  
            for (const { message: existingMessage } of messages) {
              console.log('eeeeeeeeee', existingMessage)
              ws.send(JSON.stringify(existingMessage));
            }
  
            console.log({ OLD_MESSAGES: messages });
          }
          
          await db.none(`
            INSERT INTO dbtable_schema.topic_messages (created_sub, topic, message)
            SELECT created_sub, $2, $3
            FROM dbtable_schema.sock_connections
            WHERE connection_id = $1 
          `, [message.sender, message.topic, message]);
        }
      };
  
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