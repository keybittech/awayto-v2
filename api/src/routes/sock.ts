import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import { db } from '../modules/db';

import { checkAuthenticated } from '../middlewares';
import { IBooking, IUserProfile } from 'awayto/core';

const {
  SOCK_HOST,
  SOCK_PORT
} = process.env as { [prop: string]: string };

const router = express.Router();

// Websocket Ticket Proxy
router.post('/ticket', checkAuthenticated, async (req, res, next) => {
  const user = req.user as IUserProfile;

  const bookings = (await db.manyOrNone<IBooking>(`
    SELECT id FROM dbtable_schema.bookings
    WHERE created_sub = $1
  `, [user.sub])).map(b => b.id);

  const proxyMiddleware = createProxyMiddleware({
    target: `http://${SOCK_HOST}:${SOCK_PORT}/create_ticket`,
    onProxyReq: proxyReq => {
      const bodyData = JSON.stringify({ bookings });
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  })

  proxyMiddleware(req, res, next);
});

export default router;