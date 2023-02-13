
import fs from 'fs';
import https from 'https';
import express, { Express, NextFunction, Request, Response } from 'express';
import postgres from 'pg';
import routeMatch, { RouteMatch } from 'route-match';
import cookieSession from 'cookie-session';
import cookieParser from 'cookie-parser';
import httpProxy from 'http-proxy';
import { graylog } from 'graylog2';
import { v4 as uuid } from 'uuid';

import passport from 'passport';

import APIs from './objects';
import { keycloakStrategy, StrategyUser, DecodedJWTToken } from './util/keycloak';
import { AuthEvent } from './util/db';
import jwtDecode from 'jwt-decode';
import assert from 'assert';


const { Route, RouteCollection, PathMatcher } = routeMatch as RouteMatch;


const paths = APIs.protected.map(api => {
  const path = `${api.method}/${api.path}`;
  return new Route(path, path);
});
const routeCollection = new RouteCollection(paths);
const pathMatcher = new PathMatcher(routeCollection);


const {
  GRAYLOG_HOST,
  GRAYLOG_PORT,
  PG_HOST,
  PG_PORT,
  PG_USER,
  PG_PASSWORD,
  PG_DATABASE,
  SOCK_HOST,
  SOCK_PORT
} = process.env as { [prop: string]: string } & { PG_PORT: number };

try {
  const logger = new graylog({
    servers: [{
      host: GRAYLOG_HOST as string,
      port: parseInt(GRAYLOG_PORT as string)
    }]
  });

  // Configure Postgres client
  const client = new postgres.Client({
    host: PG_HOST,
    port: PG_PORT,
    user: PG_USER,
    password: PG_PASSWORD,
    database: PG_DATABASE
  });


  // Connect to Postgres
  client.connect((err) => {
    if (err) {
      console.error('Error connecting to Postgres:', err);
      process.exit(1);
    }
  });

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

  // Fix for passport/express cookie issue
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.session && !req.session.regenerate) {
      //@ts-ignore
      req.session.regenerate = (cb) => {
        cb(null)
      }
    }
    if (req.session && !req.session.save) {
      //@ts-ignore
      req.session.save = (cb) => {
        cb && cb(null)
      }
    }
    next()
  });

  // Enable cookie parsing to read keycloak token
  app.use(cookieParser());

  app.use(passport.initialize());

  app.use(passport.authenticate('session'));

  passport.use('oidc', keycloakStrategy);

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser<Express.User>(function (user, done) {
    done(null, user);
  });

  // Set all api to be JSON consuming

  app.get('/api/auth/checkin', (req, res, next) => {
    passport.authenticate('oidc')(req, res, next);
  });

  app.get('/api/auth/login/callback', (req, res, next) => {
    passport.authenticate('oidc', {
      successRedirect: '/api/auth/checkok',
      failureRedirect: '/api/auth/checkfail',
    })(req, res, next);
  });

  var checkAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/api/auth/checkin');
  }

  app.get('/api/auth/checkok', checkAuthenticated, (req, res, next) => {
    res.status(200).end();
  });

  app.get('/api/auth/checkfail', (req, res, next) => {
    res.status(403).end();
  });

  app.use(express.json());
  
  app.post('/api/auth/webhook', async (req, res, next) => {

    // TODO send secret from auth in header to reject unauth'd public calls
    
    const requestId = uuid();
    try {
      const body = req.body as AuthEvent;
      const { type, userId, ipAddress, details } = body;

      // Create trace event
      const event = {
        requestId,
        method: 'POST',
        path: '/api/auth/webhook',
        username: details.username || '',
        public: false,
        userSub: userId,
        sourceIp: ipAddress,
        pathParameters: req.params,
        queryParameters: req.query as Record<string, string>,
        body
      };

      logger.log('webhook received', event);

      await APIs.webhooks[`AUTH_${type}`]({ event, client });

      res.status(200).end();
    } catch (error) {
      const err = error as Error & { reason: string };

      console.log('auth webhook error', err);
      logger.log('error response', { requestId, error: err });

      // Handle failures
      res.status(500).send({
        requestId,
        reason: err.reason || err.message
      });
    }
  });


  app.all(`/api/v1/:code`, checkAuthenticated, async (req: Request, res: Response) => {

    assert(req.headers.authorization, 'No auth header.');

    const requestId = uuid();

    const user = req.user as StrategyUser;
    const token = jwtDecode<DecodedJWTToken>(req.headers.authorization);
    const method = req.method;
    const path = Buffer.from(req.params.code, 'base64').toString();

    // Create trace event
    const event = {
      requestId,
      method,
      path,
      public: false,
      groups: token.groups,
      username: user.username,
      userSub: user.sub,
      sourceIp: req.headers['x-forwarded-for'] as string,
      pathParameters: req.params,
      queryParameters: req.query as Record<string, string>,
      body: req.body
    }

    logger.log('App API Request', event);

    try {
      const pathMatch = pathMatcher.match(`${method}/${path}`);
      event.pathParameters = pathMatch._params;

      const route = pathMatch._route.split(/\/(.*)/s)[1];

      const [{ cmnd }] = APIs.protected.filter(o => o.method === method && o.path === route)

      // Handle request
      const result = await cmnd({ event, client });

      // Respond
      res.status(200).json(result);

    } catch (error) {
      const err = error as Error & { reason: string };

      console.log('protected error', err);
      logger.log('error response', { requestId, error: err });

      // Handle failures
      res.status(500).send({
        requestId,
        reason: err.reason || err.message
      });
    }
  });

  // Define protected routes
  APIs.protected.forEach(({ method, path, cmnd }) => {

    // Here we make use of the extra /api from the reverse proxy
    app[method.toLowerCase() as keyof Express](`/api/${path}`, checkAuthenticated, async (req: Request & { headers: { authorization: string } }, res: Response) => {
      const requestId = uuid();

      const user = req.user as StrategyUser;

      const token = jwtDecode<DecodedJWTToken>(req.headers.authorization);

      // Create trace event
      const event = {
        requestId,
        method,
        path,
        public: false,
        groups: token.groups,
        username: user.username,
        userSub: user.sub,
        sourceIp: req.headers['x-forwarded-for'] as string,
        pathParameters: req.params,
        queryParameters: req.query as Record<string, string>,
        body: req.body
      }

      logger.log('App API Request', event);

      try {
        // Handle request
        const result = await cmnd({ event, client });

        // Respond
        res.status(200).json(result);

      } catch (error) {
        const err = error as Error & { reason: string };

        console.log('protected error', err);
        logger.log('error response', { requestId, error: err });

        // Handle failures
        res.status(500).send({
          requestId,
          reason: err.reason || err.message
        });
      }
    });
  });

  // Define public routes
  APIs.public.forEach((route) => {
    app[route.method.toLowerCase() as keyof Express](`/api/${route.path}`, async (req: Request, res: Response) => {

      // Create trace event
      const event = {
        method: route.method,
        path: route.path,
        public: true,
        sourceIp: req.headers['x-forwarded-for'] as string,
        pathParameters: req.params,
        queryParameters: req.query as Record<string, string>,
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
  app.get('/api/ticket', checkAuthenticated, (req, res, next) => {
    proxy.web(req, res, {
      target: `http://${SOCK_HOST}:${SOCK_PORT}/create_ticket`
    }, next);
  });

  // default protected route /test
  app.get('/api/404', (req, res, next) => {
    res.status(404).send();
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
