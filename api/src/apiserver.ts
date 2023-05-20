import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '../.env' })

import fs from 'fs';
import https from 'https';
import dayjs from 'dayjs';

import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import timezone from 'dayjs/plugin/timezone';
dayjs.extend(timezone);

import 'dayjs/locale/en';

import express, { Express } from 'express';

import baseRoutes from './routes/base';
import authRoutes from './routes/auth';
import sockRoutes from './routes/sock';
import twitchRoutes from './routes/twitch';

import keycloak from './modules/keycloak';
import { connected as dbConnected } from './modules/db';
import redis from './modules/redis';
import { connectToTwitch } from './modules/twitch';
import logger from './modules/logger';
import './modules/prompts';
import './modules/sock';

import { setupMiddleware } from './middlewares';

let connections: Map<string, boolean> = new Map();

function setConnections() {
  console.log({ keycloakConnected: keycloak.ready });
  connections.set('keycloak', keycloak.ready);
  console.log({ dbConnected });
  connections.set('db', dbConnected);
  console.log({ redisConnected: redis.isReady });
  connections.set('redis', redis.isReady);
  console.log({ loggerConnected: !!logger });
  connections.set('logger', !!logger);
};

async function go() {

  try {
    setConnections();

    // Gracefully wait for connections to start
    while (Array.from(connections.values()).includes(false)) {
      console.log('All connections are not available, waiting', JSON.stringify(connections));
      await new Promise<void>(res => setTimeout(() => {
        setConnections();
        res();
      }, 1250))
    }

    console.log('starting api with connections', JSON.stringify(Array.from(connections.entries())))

    // Create Express app
    const app: Express = express();

    setupMiddleware(app);

    app.use('/api', baseRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/sock', sockRoutes);
    app.use('/api/twitch', twitchRoutes);

    const key = fs.readFileSync('server.key', 'utf-8');
    const cert = fs.readFileSync('server.crt', 'utf-8');
    const creds = { key, cert };

    const httpsServer = https.createServer(creds, app);

    httpsServer.listen(9443, () => {
      console.log('Server listening on port 9443');
    });

    setTimeout(async () => {
      await connectToTwitch(httpsServer);
    }, 5000);

  } catch (error) {

    console.log('got an error in API', error);

  }
}

void go();


