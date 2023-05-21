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

import { connect as connectKc } from './modules/keycloak';
import { connect as connectDb } from './modules/db';
import redis from './modules/redis';
import { connectToTwitch } from './modules/twitch';
import './modules/prompts';
import './modules/sock';

import { setupMiddleware } from './middlewares';
import type { Server } from 'https';

// Create Express app
const app: Express = express();

const key = fs.readFileSync('server.key', 'utf-8');
const cert = fs.readFileSync('server.crt', 'utf-8');
const creds = { key, cert };

let httpsServer: Server | null = null;

redis.connect().then(() => {
  console.log('Redis Connected');
  connectDb().then(() => {
    console.log('Postgres Connected');
    connectKc().then(() => {
      console.log('Keycloak Connected');

      setupMiddleware(app);
      
      app.use('/api', baseRoutes);
      app.use('/api/auth', authRoutes);
      app.use('/api/sock', sockRoutes);
      app.use('/api/twitch', twitchRoutes);

      httpsServer = https.createServer(creds, app);

      httpsServer.listen(9443, () => {
        if (httpsServer) {
          connectToTwitch(httpsServer)
        }

        console.log('Server listening on port 9443');
      });

    })
  });
});

process.on('SIGINT', async function() {
  console.log('Shutting down...');
  if (httpsServer) {
    httpsServer.close();
  }
  process.exit(1);
})

