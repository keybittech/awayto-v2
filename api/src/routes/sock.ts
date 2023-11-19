import { Express } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { checkAuthenticated, checkBackchannel } from '../middlewares';
import { IBooking, IUserProfile, charCount } from 'awayto/core';
import { IDatabase } from 'pg-promise';
import { graylog } from 'graylog2';

const {
  SOCK_HOST,
  SOCK_PORT,
  SOCK_SECRET
} = process.env as { [prop: string]: string };

export default function buildSockRoutes(app: Express, dbClient: IDatabase<unknown>, graylogClient: graylog): void {

// Websocket Ticket Proxy
  app.post('/api/sock/ticket', checkAuthenticated, async (req, res, next) => {
  try {
    const user = req.user as IUserProfile;

    const proxyMiddleware = createProxyMiddleware({
      timeout: 5000,
      target: `http://${SOCK_HOST}:${SOCK_PORT}/create_ticket/${user.sub}`,
      onProxyReq: proxyReq => {
        proxyReq.setHeader('x-backchannel-id', SOCK_SECRET.slice(0, 5) + charCount(SOCK_SECRET));
        proxyReq.end();
      }
    });

    proxyMiddleware(req, res, next);
  } catch (error) {
    const err = error as Error;
    graylogClient.log('sockProxy', err.message)
  }
});

  app.post('/api/sock/allowances', checkBackchannel, async (req, res) => {
  const { sub } = req.body as { [prop: string]: string };

    const bookings = (await dbClient.manyOrNone<IBooking>(`
    SELECT b.id FROM dbtable_schema.bookings b
    JOIN dbtable_schema.quotes q ON q.id = b.quote_id
    JOIN dbtable_schema.schedule_bracket_slots sbs ON sbs.id = b.schedule_bracket_slot_id
    WHERE q.created_sub = $1 OR sbs.created_sub = $1
  `, [sub])).map(b => b.id);

  res.send(JSON.stringify({ allowances: { bookings } }))
})

  app.post('/api/sock/connect', checkBackchannel, async (req, res) => {
  const { sub, connectionId } = req.body as { [prop: string]: string };
      await dbClient.none(`
    INSERT INTO dbtable_schema.sock_connections (created_sub, connection_id)
    VALUES ($1::uuid, $2)
  `, [sub, connectionId]);
  res.end();
});

  app.post('/api/sock/stale', checkBackchannel, async (req, res) => {
  const staleConnections = req.body as string[];
      await dbClient.none(`
    DELETE FROM dbtable_schema.sock_connections
    WHERE created_sub || ':' || connection_id = ANY($1::text[])
  `, [staleConnections]);
  res.end();
});
}