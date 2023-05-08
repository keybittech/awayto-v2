import dotenv from 'dotenv';
dotenv.config({ path: __dirname + '../.env' })

import path from 'path';
import fetch from 'node-fetch';
import dayjs from 'dayjs';

import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import timezone from 'dayjs/plugin/timezone';
dayjs.extend(timezone);

import 'dayjs/locale/en';

import fs from 'fs';
import https from 'https';
import express, { RequestHandler, Express, NextFunction, Request, Response } from 'express';
import cookieSession from 'cookie-session';
import cookieParser from 'cookie-parser';
import httpProxy from 'http-proxy';
import jwtDecode from 'jwt-decode';
import { v4 as uuid } from 'uuid';

import passport from 'passport';
import { IdTokenClaims, Strategy, StrategyVerifyCallbackUserInfo } from 'openid-client';

import { DecodedJWTToken, UserGroupRoles, StrategyUser, ApiErrorResponse, IGroup, AuthBody, siteApiRef, AuthProps, siteApiHandlerRef, ApiProps, EndpointType } from 'awayto/core';

import { useAi } from '@keybittech/wizapp/dist/server';

import { checkAuthenticated, validateRequestBody } from './middlewares';

import WebHooks from './webhooks/index';

import keycloak, { getGroupRegistrationRedirectParts } from './modules/keycloak';
import { db, connected as dbConnected } from './modules/db';
import redis, { DEFAULT_THROTTLE, rateLimitResource, redisProxy } from './modules/redis';
import { connectToTwitch, TWITCH_REDIRECT_URI } from './modules/twitch';
import { saveFile, getFile } from './modules/fs';
import logger from './modules/logger';
import './modules/prompts';

const {
  SOCK_HOST,
  SOCK_PORT,
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  KC_API_CLIENT_SECRET
} = process.env as { [prop: string]: string } & { PG_PORT: number };

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

    app.use(express.json());

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

    passport.use('oidc', new Strategy<StrategyUser>({ client: keycloak.apiClient }, strategyResponder));

    passport.serializeUser(function (user, done) {
      done(null, user);
    });

    passport.deserializeUser<Express.User>(function (user, done) {
      done(null, user);
    });

    var checkBackchannel = (req: Request, res: Response, next: NextFunction) => {
      if (req.header('x-backchannel-id') === KC_API_CLIENT_SECRET) {
        return next()
      } else {
        res.status(404).send();
      }
    }

    // default protected route /test
    app.get('/api/join/:groupCode', async (req, res) => {
      if (await rateLimitResource(req.body.ipAddress, 'group/register')) {
        return res.status(429).send({ reason: 'Rate limit exceeded. Try again in a minute.' });
      }

      try {
        const [registrationUrl, loginCookies] = await getGroupRegistrationRedirectParts(req.params.groupCode);
        for (const cookie of loginCookies) {
          const [name, value] = cookie.split('=');
          res.cookie(name.trim(), value.trim());
        }
        res.set('Referrer-Policy', 'same-origin');
        res.redirect(registrationUrl);
      } catch (error) {
        res.status(500).send((error as ApiErrorResponse).reason);
      }
    });

    app.post('/api/auth/register/validate', checkBackchannel, async (req, res) => {
      try {
        const group = await db.one<IGroup>(`
          SELECT "allowedDomains", name
          FROM dbview_schema.enabled_groups
          WHERE code = $1
        `, [req.body.groupCode.toLowerCase()]);
        if (!group) throw new Error('BAD_GROUP');
        res.status(200).send(JSON.stringify(group));
      } catch (error) {
        const err = error as Error;
        res.status(500).send(JSON.stringify({ reason: err.message }))
      }
    });

    app.get('/api/auth/checkin', (req, res, next) => {
      passport.authenticate('oidc')(req, res, next);
    });

    app.get('/api/auth/login/callback', (req, res, next) => {
      //@ts-ignore
      if (!req.session['oidc:wcapp.site.com']) {
        res.redirect('/app');
      } else {
        passport.authenticate('oidc', {
          successRedirect: '/api/auth/checkok',
          failureRedirect: '/api/auth/checkfail',
        })(req, res, next);
      }
    });

    app.get('/api/auth/checkok', checkAuthenticated, (req, res, next) => {
      res.status(200).end();
    });

    app.get('/api/auth/checkfail', (req, res, next) => {
      res.status(403).end();
    });

    app.post('/api/auth/webhook', checkBackchannel, async (req, res) => {
      const requestId = uuid();
      try {
        const body = req.body as AuthBody;
        const { type, userId, ipAddress, details } = body;

        console.log('/api/auth/webhook', JSON.stringify(body, null, 2));

        // Create trace event
        const event = {
          requestId,
          method: 'POST',
          url: '/api/auth/webhook',
          username: details.username || '',
          public: false,
          userSub: userId,
          sourceIp: ipAddress,
          availableUserGroupRoles: {},
          pathParameters: req.params,
          queryParameters: req.query as Record<string, string>,
          body
        };

        await db.tx(async tx => {
          await WebHooks[`AUTH_${type}`]({
            event,
            db,
            tx,
            redis,
            logger,
            fetch,
            redisProxy,
            fs: { saveFile, getFile },
            ai: { useAi },
            keycloak: keycloak as unknown
          } as AuthProps);
        });

        res.status(200).send({});
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

    for (const apiRefId in siteApiRef) {
      const { method, url, queryArg, resultType, kind, opts: { cache, throttle, contentType } } = siteApiRef[apiRefId as keyof typeof siteApiRef];

      const requestHandlers: RequestHandler[] = [
        checkAuthenticated
      ];

      if ('application/octet-stream' === contentType) {
        requestHandlers.push(express.raw({ type: contentType }));
      }

      requestHandlers.push(validateRequestBody(queryArg, url));


      // Here we make use of the extra /api from the reverse proxy
      app[method.toLowerCase() as keyof Express](`/api/${url.split('?')[0]}`, requestHandlers, async (req: Request & { headers: { authorization: string } }, res: Response) => {

        const requestId = uuid();
        const user = req.user as StrategyUser;

        if ('skip' !== throttle && ((throttle || EndpointType.MUTATION === kind) && await rateLimitResource(user.sub, `${method}/${url}`, 1, throttle))) {
          return res.status(429).send({ reason: 'You must wait ' + (throttle || DEFAULT_THROTTLE) + ' seconds.', requestId });
        }

        if (await rateLimitResource(user.sub, 'api', 10, 1)) { // limit n general api requests per second
          return res.status(429).send({ reason: 'Rate limit exceeded.', requestId });
        }

        const { groupRoleActions } = await redisProxy('groupRoleActions');
        let response = {} as typeof resultType;

        const cacheKey = user.sub + req.originalUrl.slice(5); // remove /api/

        if ('get' === method.toLowerCase() && 'skip' !== cache) {
          const value = await redis.get(cacheKey);
          if (value) {
            response = JSON.parse(value);
            res.header('x-of-cache', 'true');
          }
        }

        if (!Object.keys(response).length) {

          try {

            const sourceIp = req.headers['x-forwarded-for'] as string;
            const token = jwtDecode<DecodedJWTToken & IdTokenClaims>(req.headers.authorization);
            const tokenGroupRoles = {} as UserGroupRoles;

            for (const subgroupPath of token.groups) {
              const [groupName, subgroupName] = subgroupPath.slice(1).split('/');
              tokenGroupRoles[groupName] = tokenGroupRoles[groupName] || {};
              tokenGroupRoles[groupName][subgroupName] = groupRoleActions[subgroupPath]?.actions.map(a => a.name) || []
            }

            // Create trace event
            const requestParams = {
              db,
              redis,
              keycloak: keycloak as unknown,
              redisProxy,
              fetch,
              fs: { saveFile, getFile },
              ai: { useAi },
              logger,
              event: {
                requestId,
                method,
                url,
                public: false,
                groups: token.groups,
                availableUserGroupRoles: tokenGroupRoles,
                username: user.username,
                userSub: user.sub,
                sourceIp,
                pathParameters: req.params as Record<string, string>,
                queryParameters: req.query as Record<string, string>,
                body: req.body as typeof queryArg
              }
            } as ApiProps<typeof queryArg>;

            const handler = siteApiHandlerRef[apiRefId as keyof typeof siteApiHandlerRef] as (params: ApiProps<typeof queryArg>) => Promise<typeof resultType>;

            const txHandler = async (props: ApiProps<typeof queryArg>): Promise<typeof resultType> => {
              const eventLength = JSON.stringify(requestParams.event).length;
              console.log('handling', method, url, user.sub, requestId, eventLength);
              if (EndpointType.MUTATION === kind) {
                return await db.tx(async trx => {
                  requestParams.tx = trx;
                  logger.log('Handling api mutation with size ' + eventLength, requestParams.event);
                  return await handler(props);
                })
              }

              logger.log('Handling api query with size ' + eventLength, requestParams.event);
              return await handler(props);
            }

            response = await txHandler(requestParams);

            /**
            * Cache settings:
            * 'skip' - Bypasses caching entirely
            * null - GET: Stores indefinitely; Non-GET: Deletes if exists
            * true/number - GET: Stores with 180s (or custom) expiry; Non-GET: Deletes if exists
            */

            if (response && 'boolean' !== typeof response && 'skip' !== cache) {
              if ('get' === method.toLowerCase()) {
                if (null === cache) {
                  await redis.set(cacheKey, JSON.stringify(response))
                } else {
                  await redis.setEx(cacheKey, cache as number || 180, JSON.stringify(response));
                }
                res.header('x-in-cache', 'true');
              } else {
                if (null !== cache) {
                  await redis.del(cacheKey);
                }
              }
            }

          } catch (error) {
            const { message, reason, requestId: _, ...actionProps } = error as Error & ApiErrorResponse;

            console.log('protected error', message || reason);
            logger.log('error response', { requestId, message, reason });

            // Handle failures
            res.status(500).send({
              requestId,
              reason: reason || message,
              ...actionProps
            });
            return;
          }
        }

        if (!!response || 'object' === typeof response && Object.keys(response).length) {
          // Respond
          res.status(200).json(response);
        } else {
          res.status(500).send({ reason: 'Cannot process request', requestId })
        }
      });
    }

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
    app.get('/api/twitch/webhook', async (req, res, next) => {
      try {
        const { code, access_token } = req.query;

        if (access_token) {
          await redis.set('client_access_token', access_token as string);
        } else if (code) {

          const tokenData = [{
            name: 'client_id',
            value: TWITCH_CLIENT_ID
          }, {
            name: 'client_secret',
            value: TWITCH_CLIENT_SECRET
          }, {
            name: 'code',
            value: code
          }, {
            name: 'grant_type',
            value: 'authorization_code'
          }, {
            name: 'redirect_uri',
            value: TWITCH_REDIRECT_URI
          }];
  
          const tokenRequest = await fetch('https://id.twitch.tv/oauth2/token', {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            method: 'POST',
            body: tokenData.map(d => `${encodeURIComponent(d.name)}=${encodeURIComponent(d.value as string)}`).join('&')
          });
  
          const { access_token: new_access_token, refresh_token } = await tokenRequest.json() as { access_token: string, refresh_token: string };
  
          await redis.set('twitch_token', new_access_token as string);
          await redis.set('twitch_refresh', refresh_token as string);
        }
        
        res.status(200).send();
      } catch (error) {
        console.log('twitch webhook error', error)
      }

    });

    app.get('/api/twitch/events', (req, res) => {
      res.sendFile(path.join(__dirname, '../src/modules/twitch_events.html'));
    });

    // Health Check
    app.get('/api/health', (req, res) => {
      let status = 'OK';

      setConnections();
      if (Array.from(connections.values()).includes(false)) {
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

    connectToTwitch(httpsServer);

  } catch (error) {

    console.log('got an error in API', error);

  }
}

void go();


