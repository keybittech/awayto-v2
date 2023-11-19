import { WebSocket } from 'ws';
import { IDatabase } from 'pg-promise';

import { SocketParticipant, SocketResponse, charCount } from 'awayto/core';

const {
  SOCK_HOST,
  SOCK_PORT,
  SOCK_SECRET
} = process.env as { [prop: string]: string };

async function getSubDetails(dbClient: IDatabase<unknown>, parts: SocketParticipant[]) {
  try {
    for (const part of parts) {
      const partDetails = await dbClient.one<{ name: string, role: string }>(`
        SELECT
          LEFT(u.first_name, 1) || LEFT(u.last_name, 1) as name,
          r.name as role
        FROM dbtable_schema.users u
        JOIN dbtable_schema.group_users gu ON gu.user_id = u.id
        JOIN dbtable_schema.group_roles gr ON gr.external_id = gu.external_id
        JOIN dbtable_schema.roles r ON r.id = gr.role_id
        WHERE u.sub = $1
      `, [part.scid]);
      Object.assign(part, partDetails);
    }
  
    return parts.map(part => ({
      scid: `${part.name}#${charCount(part.scid)}`,
      cids: part.cids,
      name: part.name.toUpperCase(),
      role: part.role
    }));
  } catch (error) {
    console.log('failed to get sub details', error);
  }
}

export async function initSocket(dbClient: IDatabase<unknown>) {
  try {
    const ws = new WebSocket(`ws://${SOCK_HOST}:${SOCK_PORT}`, {
      headers: {
        'x-backchannel-id': SOCK_SECRET.slice(0, 5) + charCount(SOCK_SECRET)
      }
    });

    ws.onopen = () => {
      console.log('socket open');
    };

    ws.onmessage = async ({ data }) => {
      const { store, ...event } = JSON.parse(data.toString()) as SocketResponse<unknown>;
      if ('subscribe-topic' === event.action) {
        const subscribers = await dbClient.manyOrNone<SocketParticipant>(`
          SELECT
            ARRAY_AGG(source.connection_id) as cids,
            source.created_sub as scid
          FROM dbtable_schema.sock_connections source
          JOIN dbtable_schema.sock_connections sc ON sc.connection_id = $2
          WHERE source.created_sub = sc.created_sub
          GROUP BY source.created_sub
        `,[event.topic, event.payload as string]);
        
        if (subscribers) {
          const subDetails = await getSubDetails(dbClient, subscribers);
          if (subDetails) {
            event.payload = subDetails
            ws.send(JSON.stringify(event));
          }
        }
      } else if ('existing-subscribers' === event.action) {
        const subscribers = await dbClient.manyOrNone<SocketParticipant>(`
          SELECT DISTINCT
            ARRAY_AGG(connection_id) as cids,
            created_sub as scid
          FROM dbtable_schema.topic_messages
          WHERE topic = $1
          GROUP BY created_sub
        `, [event.topic]);
        if (subscribers) {
          const subDetails = await getSubDetails(dbClient, subscribers);
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
      } else if ('load-messages' === event.action) {
        const messages = await dbClient.manyOrNone<{ timestamp: string, message: SocketResponse<unknown> }>(`
          SELECT JSONB_SET(message, '{timestamp}', TO_JSONB(created_on), true) as message
          FROM dbtable_schema.topic_messages
          WHERE topic = $1
          ORDER BY created_on ASC
        `, [event.topic]);
        for (const { message } of messages) {
          if (!['subscribe', 'unsubscribe'].includes(message.action)) {
            ws.send(JSON.stringify({
              target: event.sender,
              payload: message
            }));
          }
        }
      }

      if (store) {
        await dbClient.none(`
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
        initSocket(dbClient);
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