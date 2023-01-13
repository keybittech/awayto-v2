import express, { Express, Request, Response } from 'express';
import postgres from 'pg';
import session from 'express-session';
import KeyCloak from 'keycloak-connect';
import httpProxy from 'http-proxy';
import cors from 'cors';

import Objects from './objects';

import auditRequest from './util/auditor';
import authorize from './util/auth';

// KeyCloak Store
const memoryStore = new session.MemoryStore();

// Proxy to WSS
const proxy = httpProxy.createProxyServer();

// Create Express app
const app: Express = express();

// Set all api to be JSON consuming
app.use(express.json());

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

// Attach keycloak
const keycloak = new KeyCloak({ store: memoryStore });

app.use(keycloak.middleware({
  logout: '/logout',
  admin: '/'
}));

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

// Define protected routes
Objects.protected.forEach((route) => {
  app[route.method.toLowerCase() as keyof Express](route.path, keycloak.protect('realm:devel'), async (req: Request, res: Response) => {

    // Create trace event
    const event = {
      httpMethod: route.method,
      userSub: 'string',
      sourceIp: req.headers['x-forwarded-for'] as string,
      pathParameters: req.params,
      body: req.body
    }
    
    // Handle request
    const result = await route.cmnd({ event, client });

    // Respond
    res.json(result);
  });
});

// Define public routes
Objects.public.forEach((route) => {
  app[route.method.toLowerCase() as keyof Express](route.path, async (req: Request, res: Response) => {

    // Create trace event
    const event = {
      httpMethod: route.method,
      userSub: 'string',
      sourceIp: req.headers['x-forwarded-for'] as string,
      pathParameters: req.params,
      body: req.body
    }
    
    // Handle request
    const result = await route.cmnd({ event, client });

    // Respond
    res.json(result);
  });
});

// Websocket Ticket Proxy
app.post('/ticket', keycloak.protect('realm:devel'), (req, res, next) => {
  proxy.web(req, res, {
    target: 'http://192.168.1.53:8081/create_ticket'
  }, next);
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

// 404 else
app.use('*', function (req, res) {
  res.send('Not found!');
});

// Start server
app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
