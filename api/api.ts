import express, { Express, Request, Response } from 'express';
import postgres from 'pg';
import cookieSession from 'cookie-session';
import cookieParser from 'cookie-parser';
import httpProxy from 'http-proxy';
import cors from 'cors';
import fs from 'fs';
import https from 'https';
import Keycloak, { KeycloakConfig } from 'keycloak-connect';
import { graylog } from 'graylog2';
import { v4 as uuid } from 'uuid';

import Objects from './objects';

type KCAuthRequest = Request & {
  kauth: {
    grant: {
      access_token: {
        content: { [prop: string]: string }
      }
    }
  }
}

try {

  const logger = new graylog({
    servers: [{
      host: process.env.GRAYLOG_HOST as string,
      port: parseInt(process.env.GRAYLOG_PORT as string)
    }]
  });

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

  // Init Keycloak
  const keycloak = new Keycloak({ cookies: true }, {
    "realm": process.env.KC_REALM,
    "auth-server-url": `${process.env.BUILD_HOST_PROTOCOL}://${process.env.BUILD_HOST_NAME}/auth`,
    "ssl-required": "external",
    "resource": process.env.KC_CLIENT,
    "public-client": true,
    "confidential-port": 0
  } as KeycloakConfig & { 'public-client': boolean });

  // Create Express app
  const app: Express = express();

  // // Configure for reverse proxy
  app.set('trust proxy', true);

  // Store keycloak token in session
  app.use(cookieSession({
    name: 'primary_session',
    secret: 'skjrhvp43hgf90348hg9348hg9348hgf934hg',
    maxAge: 24 * 60 * 60 * 1000
  }));

  // Enable cookie parsing to read keycloak token
  app.use(cookieParser());

  // Keycloak auto recognize headers, etc
  app.use(keycloak.middleware());

  // Enable CORS
  app.use(cors());

  // Set all api to be JSON consuming
  app.use(express.json());

  // Define protected routes
  Objects.protected.forEach(({ method, path, cmnd }) => {

    // Here we make use of the extra /api from the reverse proxy because keycloak responses can be redirected back here and we can't change the redirect url with keycloak-connect
    app[method.toLowerCase() as keyof Express](`/api/${path}`, keycloak.protect(), async (req: KCAuthRequest, res: Response) => {
      const requestId = uuid();
      // Create trace event
      const event = {
        requestId,
        method,
        path,
        userSub: req.kauth.grant.access_token.content.preferred_username,
        sourceIp: req.headers['x-forwarded-for'] as string,
        pathParameters: req.params,
        body: req.body
      }

      logger.log('request attempt', event);

      try {
        // Handle request
        const result = await cmnd({ event, client });

        // Respond
        res.status(200).json(result);

      } catch (error) {

        logger.log('error response', Object.assign(event, { error }));

        // Handle failures
        res.status(500).send({ requestId });
      }
    });
  });

  // Define public routes
  Objects.public.forEach((route) => {
    app[route.method.toLowerCase() as keyof Express](`/api/${route.path}`, async (req: Request, res: Response) => {

      // Create trace event
      const event = {
        method: route.method,
        path: route.path,
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

  // Proxy to WSS
  const proxy = httpProxy.createProxyServer();

  // Websocket Ticket Proxy
  app.post('/api/ticket', keycloak.protect(), (req, res, next) => {
    proxy.web(req, res, {
      target: `http://${process.env.SOCK_HOST}:${process.env.SOCK_PORT}/create_ticket`
    }, next);
  });

  // default protected route /test
  app.get('/api/404', (req, res, next) => {
    res.status(404).send('Not found.');
  });

  // Health Check
  app.get('/api/health', (req, res) => {
    let status = 'OK';

    // Check if Postgres client is connected
    if (!client) {
      status = 'Error';
    }

    res.send(status);
  });

  const key = fs.readFileSync('server.key', 'utf-8');
  const cert = fs.readFileSync('server.crt', 'utf-8');
  const creds = { key, cert };

  const httpsServer = https.createServer(creds, app);

  httpsServer.listen(9443, () => {
    console.log('Server listening on port 9443');
  });

} catch (error) {

  console.log('got an error in API', error);

}
