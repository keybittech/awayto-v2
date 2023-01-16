import express, { Express, Request, Response } from 'express';
import postgres from 'pg';
import session from 'express-session';
import httpProxy from 'http-proxy';
import cors from 'cors';
import fs from 'fs';
import https from 'https';
import Keycloak from 'keycloak-connect';

import Objects from './objects';
import keycloakConfig from './keycloak.json';

import auditRequest from './util/auditor';
import authorize from './util/auth';
import { inspect } from 'util';

try {

  // Configure Postgres client
  const client = new postgres.Client({
    host: process.env.PG_HOST,
    port: process.env.PG_PORT as number | undefined,
    user: process.env.PG_USER,
    password: process.env.PG_PASSWORD,
    database: process.env.PG_DATABASE
  });
  
  // Connect to Postgres
  client.connect((err) => {
    if (err) {
      console.error('Error connecting to Postgres:', err);
      process.exit(1);
    }
  });

  // KeyCloak Store
  const memoryStore = new session.MemoryStore();

  const keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);

  // Proxy to WSS
  const proxy = httpProxy.createProxyServer();

  // Create Express app
  const app: Express = express();

  // // Configure for reverse proxy
  app.set('trust proxy', true);

  // Keycloak auto recognize headers, etc
  app.use(keycloak.middleware());

  // Enable CORS
  app.use(cors());

  // Use same session as keycloak
  app.use(
    session({
      secret: 'akvn430h',
      resave: false,
      saveUninitialized: true,
      store: memoryStore
    })
  );

  // Set all api to be JSON consuming
  app.use(express.json());

  // Define protected routes
  Objects.protected.forEach((route) => {
    // Here we make use of the extra /api from the reverse proxy because keycloak responses can be redirected back here and we can't change the redirect url with keycloak-connect
    app[route.method.toLowerCase() as keyof Express](`/api/${route.path}`, keycloak.protect(), async (req: Request, res: Response) => {

      // Create trace event
      const event = {
        httpMethod: route.method,
        userSub: 'string',
        sourceIp: req.headers['x-forwarded-for'] as string,
        pathParameters: req.params,
        body: req.body
      }

      console.log('activity', 'protected api', inspect(event));

      try {
        // Handle request
        const result = await route.cmnd({ event, client });

        // Respond
        res.status(200).json(result);

      } catch (err) {

        // Handle failures
        res.status(500).send(err);
      }
    });
  });

  // Define public routes
  Objects.public.forEach((route) => {
    app[route.method.toLowerCase() as keyof Express](`/api/${route.path}`, async (req: Request, res: Response) => {

      // Create trace event
      const event = {
        httpMethod: route.method,
        userSub: 'string',
        sourceIp: req.headers['x-forwarded-for'] as string,
        pathParameters: req.params,
        body: req.body
      };

      // Handle request
      const result = await route.cmnd({ event, client });

      // Respond
      res.json(result);
    });
  });

  // Websocket Ticket Proxy
  app.post('/api/ticket', keycloak.protect(), (req, res, next) => {
    proxy.web(req, res, {
      target: 'https://192.168.1.53/sock/create_ticket'
    }, next);
  });

  // default protected route /test
  app.get('/404', (req, res, next) => {
    res.status(404).send('Not found.');
  });

  // Health Check
  app.get('/health', (req, res) => {
    let status = 'OK';

    // Check if Postgres client is connected
    if (!client) {
      status = 'Error';
    }

    res.send(status);
  });

  const key = fs.readFileSync('server.key', 'utf-8');
  const cert = fs.readFileSync('server.cert', 'utf-8');
  const creds = { key, cert };

  const httpsServer = https.createServer(creds, app);

  httpsServer.listen(9443, () => {
    console.log('Server listening on port 9443');
  });

} catch (error) {

  console.log('got an error in API', error);

}
