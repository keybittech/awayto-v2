import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '../.env' })

import fs from 'fs';
import https from 'https';
import dayjs from 'dayjs';
import tls from 'tls';

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
import kioskRoutes from './routes/kiosk';

import { connect as connectKc } from './modules/keycloak';
import { connect as connectDb } from './modules/db';
import redis from './modules/redis';
import './modules/prompts';
import './modules/sock';

import { setupMiddleware } from './middlewares';

// Create Express app
const app: Express = express();

if (!process.env.HOST_KEY_LOC || !process.env.HOST_CERT_LOC) {
  throw 'Missing cert files.';
}

const key = fs.readFileSync(process.env.HOST_KEY_LOC, 'utf-8');
const cert = fs.readFileSync(process.env.HOST_CERT_LOC, 'utf-8');

if (process.env.EXIT_FULLCHAIN_LOC && process.env.CA_CERT_LOC) {
  const exitFullchain = fs.readFileSync(process.env.EXIT_FULLCHAIN_LOC, 'utf-8');
  const caCert = fs.readFileSync(process.env.CA_CERT_LOC, 'utf-8');
  https.globalAgent.options.ca = [ ...tls.rootCertificates, exitFullchain, caCert ];
}

const creds = { key, cert };
const httpsServer = https.createServer(creds, app)

httpsServer.listen(9443, () => {
  console.log('Server listening on port 9443');
    
  redis.connect().then(() => {
    console.log('Redis Connected');
    
    setupMiddleware(app).then(() => {
      console.log('Middleware setup');
      console.log('Configuring routes');
      app.use('/api', baseRoutes);
      console.log('api configured');
      app.use('/api/auth', authRoutes);
      console.log('auth configured');
      app.use('/api/sock', sockRoutes);
      console.log('sock configured');
      app.use('/api/kiosk', kioskRoutes);
      console.log('kiosk configured');

      connectDb().then(() => {
        console.log('Postgres Connected');
        connectKc().then(() => {
          console.log('Keycloak Connected');
        });
      });
    });
  });
});

// process.once('SIGUSR2', function () {
//   process.kill(process.pid, 'SIGUSR2');
// });

// process.on('SIGINT', function () {
//   // this is only called on ctrl+c, not restart
//   process.kill(process.pid, 'SIGINT');
// });

