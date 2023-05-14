import express from 'express';
import httpProxy from 'http-proxy';

import { checkAuthenticated } from '../middlewares';

const {
  SOCK_HOST,
  SOCK_PORT
} = process.env as { [prop: string]: string };

const router = express.Router();

// Proxy to WSS
const proxy = httpProxy.createProxyServer();

// Websocket Ticket Proxy
router.get('/ticket', checkAuthenticated, (req, res, next) => {
  proxy.web(req, res, {
    target: `http://${SOCK_HOST}:${SOCK_PORT}/create_ticket`
  }, next);
});

export default router;