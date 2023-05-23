import { WebSocket } from 'ws';

import { SocketParticipant, SocketResponse, charCount } from 'awayto/core';
import { db } from './db';

const {
  SOCK_HOST,
  SOCK_PORT,
  SOCK_SECRET
} = process.env as { [prop: string]: string };

async function getSubDetails(parts: SocketParticipant[]) {
  try {
    for (const part of parts) {
      const partDetails = await db.one<{ name: string, role: string }>(`
        SELECT
          LEFT(first_name, 1) || LEFT(last_name, 1) as name,
          'Tutor' as role
        FROM dbtable_schema.users
        WHERE sub = $1
      `, [part.scid]);
      Object.assign(part, partDetails);
    }
  
    return parts.map(part => ({
      scid: `${part.name}#${charCount(part.scid)}`,
      cids: part.cids,
      name: part.name.toUpperCase(),
      role: 'Tutor'
    }));
  } catch (error) {
    console.log('failed to get sub details', error);
  }
}

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
        const { store, ...event } = JSON.parse(data.toString()) as SocketResponse<unknown>;
        if ('subscribe-topic' === event.type) {
          const subscribers = await db.manyOrNone<SocketParticipant>(`
            SELECT
              ARRAY_AGG(source.connection_id) as cids,
              source.created_sub as scid
            FROM dbtable_schema.sock_connections source
            JOIN dbtable_schema.sock_connections sc ON sc.connection_id = $2
            WHERE source.created_sub = sc.created_sub
            GROUP BY source.created_sub
          `,[event.topic, event.payload as string]);
          
          if (subscribers) {
            const subDetails = await getSubDetails(subscribers);
            if (subDetails) {
              event.payload = subDetails
              ws.send(JSON.stringify(event));
            }
          }
        } else if ('existing-subscribers' === event.type) {
          const subscribers = await db.manyOrNone<SocketParticipant>(`
            SELECT DISTINCT
              ARRAY_AGG(connection_id) as cids,
              created_sub as scid
            FROM dbtable_schema.topic_messages
            WHERE topic = $1
            GROUP BY created_sub
          `, [event.topic]);
          if (subscribers) {
            const subDetails = await getSubDetails(subscribers);
            if (subDetails && subDetails.length) {
              ws.send(JSON.stringify({
                target: event.sender,
                payload: {
                  ...event,
                  payload: subDetails
                }
              }));
            }
          }
        } else if ('load-messages' === event.type) {
          const messages = await db.manyOrNone<{ message: SocketResponse<unknown> }>(`
            SELECT message
            FROM dbtable_schema.topic_messages
            WHERE topic = $1
            ORDER BY created_on ASC
          `, [event.topic]);
          for (const { message } of messages) {
            if (!['subscribe', 'unsubscribe'].includes(message.type))
            ws.send(JSON.stringify({
              target: event.sender,
              payload: message
            }));
          }
        }

        if (store) {
          await db.none(`
            INSERT INTO dbtable_schema.topic_messages (created_sub, topic, message, connection_id)
            SELECT created_sub, $2, $3, $1
            FROM dbtable_schema.sock_connections
            WHERE connection_id = $1
          `, [event.sender, event.topic, event]);
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