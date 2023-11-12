import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { db } from '../modules/db';
import logger from '../modules/logger';

import { checkAuthenticated, checkBackchannel } from '../middlewares';
import { IBooking, IUserProfile, charCount } from 'awayto/core';

const {
  SOCK_HOST,
  SOCK_PORT,
  SOCK_SECRET
} = process.env as { [prop: string]: string };

const router = express.Router();

// Websocket Ticket Proxy
router.post('/ticket', checkAuthenticated, async (req, res, next) => {
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
    logger.log('sockProxy', err.message)
  }
});

router.post('/allowances', checkBackchannel, async (req, res ) => {
  const { sub } = req.body as { [prop: string]: string };

  const bookings = (await db.manyOrNone<IBooking>(`
    SELECT b.id FROM dbtable_schema.bookings b
    JOIN dbtable_schema.quotes q ON q.id = b.quote_id
    JOIN dbtable_schema.schedule_bracket_slots sbs ON sbs.id = b.schedule_bracket_slot_id
    WHERE q.created_sub = $1 OR sbs.created_sub = $1
  `, [sub])).map(b => b.id);

  res.send(JSON.stringify({ allowances: { bookings } }))
})

router.post('/connect', checkBackchannel, async (req, res) => {
  const { sub, connectionId } = req.body as { [prop: string]: string };
  await db.none(`
    INSERT INTO dbtable_schema.sock_connections (created_sub, connection_id)
    VALUES ($1::uuid, $2)
  `, [sub, connectionId]);
  res.end();
});

router.post('/stale', checkBackchannel, async (req, res) => {
  const staleConnections = req.body as string[];
  await db.none(`
    DELETE FROM dbtable_schema.sock_connections
    WHERE created_sub || ':' || connection_id = ANY($1::text[])
  `, [staleConnections]);
  res.end();
});

export default router;