import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { db } from '../modules/db';
import logger from '../modules/logger';

import { checkAuthenticated, checkBackchannel } from '../middlewares';
import { IBooking, IUserProfile } from 'awayto/core';

const {
  SOCK_HOST,
  SOCK_PORT
} = process.env as { [prop: string]: string };

const router = express.Router();

// Websocket Ticket Proxy
router.post('/ticket', checkAuthenticated, async (req, res, next) => {
  try {
    const user = req.user as IUserProfile;

    const bookings = (await db.manyOrNone<IBooking>(`
      SELECT b.id FROM dbtable_schema.bookings b
      JOIN dbtable_schema.schedule_bracket_slots sbs ON sbs.id = b.schedule_bracket_slot_id
      WHERE b.created_sub = $1 OR sbs.created_sub = $1
    `, [user.sub])).map(b => b.id);

    const proxyMiddleware = createProxyMiddleware({
      target: `http://${SOCK_HOST}:${SOCK_PORT}/create_ticket/${user.sub}`,
      onProxyReq: proxyReq => {
        const bodyData = JSON.stringify({ bookings });
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      },
      selfHandleResponse: true,
      onProxyRes: (proxyRes, req, res) => {
        var body = '';
        proxyRes.on('data', function(data) {
          body += data;
        });
        proxyRes.on('end', async function() {
          await db.none(`
            INSERT INTO dbtable_schema.sock_connections (created_sub, connection_id)
            VALUES ($1::uuid, $2)
          `, [user.sub, body.split(':')[1]]);
          res.send(body);
        });
      }
    })

    proxyMiddleware(req, res, next);
  } catch (error) {
    const err = error as Error;
    logger.log('sockProxy', err.message)
  }
});

router.post('/stale', checkBackchannel, async (req, res) => {
  const staleConnections = req.body as string[];
  await db.none(`
    DELETE FROM dbtable_schema.sock_connections
    WHERE created_sub || ':' || connection_id = ANY($1::text[])
  `, [staleConnections]);
  res.end();
})

export default router;