import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '../.env' })

import fs from 'fs';
import https from 'https';
import express, { Express, NextFunction, Request, Response } from 'express';
import { Client } from 'pg';
import routeMatch, { RouteMatch } from 'route-match';
import cookieSession from 'cookie-session';
import cookieParser from 'cookie-parser';
import httpProxy from 'http-proxy';
import jwtDecode from 'jwt-decode';
import assert from 'assert';
import { v4 as uuid } from 'uuid';

import passport from 'passport';

import APIs from './apis/index';
import WebHooks from './webhooks/index';
import { keycloakClient, groupRoleActions } from './util/keycloak';

import { DecodedJWTToken, UserGroupRoles, StrategyUser, ILoadedState, IActionTypes } from 'awayto';
import { IdTokenClaims, Strategy, StrategyVerifyCallbackUserInfo } from 'openid-client';

import redis, { RedisClient } from './util/redis';
import logger from './util/logger';
import { db, connected as dbConnected } from './util/db';

// import './util/twitch';


/**
 * @category API
 */
export type ApiProps = {
  event: {
    method: string;
    path: string;
    public: boolean;
    username?: string;
    userSub: string;
    sourceIp: string;
    groups?: string[];
    availableUserGroupRoles: UserGroupRoles;
    pathParameters: Record<string, string>,
    queryParameters: Record<string, string>,
    body: Array<ILoadedState> | Record<string, unknown> | AuthEvent
  };
  db: Client;
  redis: RedisClient;
}

export type IWebhooks = {
  [prop: string]: (event: Partial<ApiProps>) => Promise<void>;
};

/**
 * @category API
 */
export type ApiModule = ApiModulet[];

export type ApiResponseBody = ILoadedState | ILoadedState[] | boolean;

/**
 * @category API
 */
export type ApiModulet = {
  roles?: string;
  inclusive?: boolean;
  method: string;
  path: string;
  cmnd(props: ApiProps, meta?: string): Promise<ApiResponseBody>;
}

export type AuthEvent = {
  id: string;
  clientId: string;
  realmId: string;
  ipAddress: string;
  sessionId: string;
  userId: string;
  time: string;
  type: string;
  details: Record<string, string>
};

const { Route, RouteCollection, PathMatcher } = routeMatch as RouteMatch;


const paths = APIs.protected.map(api => {
  const path = `${api.method}/${api.path}`;
  return new Route(path, path);
});
const routeCollection = new RouteCollection(paths);
const pathMatcher = new PathMatcher(routeCollection);


const {
  SOCK_HOST,
  SOCK_PORT
} = process.env as { [prop: string]: string } & { PG_PORT: number };

let connections: Record<string, boolean>;

function setConnections() {
  connections = {
    keycloak: !!keycloakClient,
    db: dbConnected,
    redis: redis.isReady,
    logger: !!logger
  }
};

setConnections();

async function go() {

  try {

    // Gracefully wait for connections to start
    while (Object.values(connections).includes(false)) {
      console.log('All connections are not available, waiting', JSON.stringify(connections, null, 2));
      await new Promise<void>(res => setTimeout(() => {
        setConnections();
        res();
      }, 5000))
    }

    console.log('starting api with connections', JSON.stringify(connections, null, 2))

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

    const strategyResponder: StrategyVerifyCallbackUserInfo<StrategyUser> = (tokenSet, userInfo, done) => {

      const { preferred_username: username, given_name: firstName, family_name: lastName, email, sub } = tokenSet.claims();

      const userProfileClaims: StrategyUser = {
        username,
        firstName,
        lastName,
        email,
        sub
      };

      return done(null, userProfileClaims);
    }

    passport.use('oidc', new Strategy<StrategyUser>({ client: keycloakClient }, strategyResponder));

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
          availableUserGroupRoles: {},
          pathParameters: req.params,
          queryParameters: req.query as Record<string, string>,
          body
        };

        logger.log('webhook received', event);

        await WebHooks[`AUTH_${type}`]({ event, db, redis });

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
      const token = jwtDecode<DecodedJWTToken & IdTokenClaims>(req.headers.authorization);
      const method = req.method;
      const path = Buffer.from(req.params.code, 'base64').toString();

      const tokenGroupRoles = {} as UserGroupRoles;
      token.groups.forEach(subgroupPath => {
        const [groupName, subgroupName] = subgroupPath.slice(1).split('/');
        tokenGroupRoles[groupName] = tokenGroupRoles[groupName] || {};
        tokenGroupRoles[groupName][subgroupName] = groupRoleActions[subgroupPath].actions.map(a => a.name)
      });

      // Create trace event
      const event = {
        requestId,
        method,
        path,
        public: false,
        groups: token.groups,
        availableUserGroupRoles: tokenGroupRoles,
        username: user.username,
        userSub: user.sub,
        sourceIp: req.headers['x-forwarded-for'] as string,
        pathParameters: req.params,
        queryParameters: req.query as Record<string, string>,
        body: req.body
      }

      try {
        const pathMatch = pathMatcher.match(`${method}/${path}`);
        event.pathParameters = pathMatch._params;

        const route = pathMatch._route.split(/\/(.*)/s)[1];

        const [{ cmnd }] = APIs.protected.filter(o => o.method === method && o.path === route);

        // Handle request
        logger.log('App API Request', event);
        const result = await cmnd({ event, db, redis });

        // Respond
        res.status(200).json(result);

      } catch (error) {
        const err = error as Error & { reason: string };

        console.log('protected error', err.message);
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

        let response: ApiResponseBody = false;

        const user = req.user as StrategyUser;
        const cacheKey = user.sub + path;

        if ('get' === method.toLowerCase()) {
          const value = await redis.get(cacheKey);
          if (value) {
            response = JSON.parse(value);
            res.header('x-of-cache', 'true');
          }
        }

        if (!response) {
          const requestId = uuid();

          const token = jwtDecode<DecodedJWTToken & IdTokenClaims>(req.headers.authorization);

          const tokenGroupRoles = {} as UserGroupRoles;
          token.groups.forEach(subgroupPath => {
            const [groupName, subgroupName] = subgroupPath.slice(1).split('/');
            tokenGroupRoles[groupName] = tokenGroupRoles[groupName] || {};
            tokenGroupRoles[groupName][subgroupName] = groupRoleActions[subgroupPath].actions.map(a => a.name)
          });

          // Create trace event
          const event = {
            requestId,
            method,
            path,
            public: false,
            groups: token.groups,
            availableUserGroupRoles: tokenGroupRoles,
            username: user.username,
            userSub: user.sub,
            sourceIp: req.headers['x-forwarded-for'] as string,
            pathParameters: req.params,
            queryParameters: req.query as Record<string, string>,
            body: req.body
          }

          try {
            // Handle request
            logger.log('App API Request', event);
            response = await cmnd({ event, db, redis });
            if ('get' === method.toLowerCase()) {
              redis.setEx(cacheKey, 10, JSON.stringify(response));
              res.header('x-in-cache', 'true');
            }
          } catch (error) {
            const err = error as Error & { reason: string };

            console.log('protected error', err.message);
            logger.log('error response', { requestId, error: err });

            // Handle failures
            res.status(500).send({
              requestId,
              reason: err.reason || err.message
            });
            return;
          }
        }

        if (response) {
          // Respond
          res.status(200).json(response);
        }
      });
    });

    // Define public routes
    // APIs.public.forEach((route) => {
    //   app[route.method.toLowerCase() as keyof Express](`/api/${route.path}`, async (req: Request, res: Response) => {

    //     // Create trace event
    //     const event = {
    //       method: route.method,
    //       path: route.path,
    //       public: true,
    //       availableUserGroupRoles: {},
    //       sourceIp: req.headers['x-forwarded-for'] as string,
    //       pathParameters: req.params,
    //       queryParameters: req.query as Record<string, string>,
    //       body: req.body
    //     };

    //     // Handle request
    //     const result = await route.cmnd({ event, client });

    //     // Respond
    //     res.json(result);
    //   });
    // });

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

    // default protected route /test
    app.get('/api/twitch/webhook', (req, res, next) => {
      console.log(req)
      res.status(404).send();
    });

    // Health Check
    app.get('/api/health', (req, res) => {
      let status = 'OK';

      setConnections();
      if (Object.values(connections).includes(false)) {
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
}

void go();


