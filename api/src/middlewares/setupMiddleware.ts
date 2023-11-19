import cookieParser from 'cookie-parser';
import RedisStore from 'connect-redis';
import session from 'express-session';
import passport from 'passport';
import express, { Request, Response, NextFunction, Express } from 'express';
import { Strategy, StrategyVerifyCallbackUserInfo, Issuer } from 'openid-client';
import { Redis } from 'ioredis';

import { StrategyUser } from 'awayto/core';

const {
  API_COOKIE,
  KC_HOST,
  KC_PORT,
  KC_REALM,
  KC_API_CLIENT_ID,
  KC_API_CLIENT_SECRET,
  CUST_APP_HOSTNAME
} = process.env as { [prop: string]: string };

const keycloakDiscoveryUrl = `https://${KC_HOST}:${KC_PORT}/realms/${KC_REALM}`;

export const keycloakClientConfiguration = {
  client_id: KC_API_CLIENT_ID,
  client_secret: KC_API_CLIENT_SECRET,
  redirect_uris: [`https://${CUST_APP_HOSTNAME}/api/auth/login/callback`],
  post_logout_redirect_uris: [`https://${CUST_APP_HOSTNAME}/api/auth/logout/callback`],
  response_types: ['code']
}

export async function setupMiddleware(redisClient: Redis, expressApp: Express) {
  
  // Configure for reverse proxy
  console.log('Setting trust proxy');
  expressApp.set('trust proxy', true);

  // console.log('Setting cookie session secret');
  // Store keycloak token in session
  // expressApp.use(cookieSession({
  //   name: 'primary_session',
  //   secret: API_COOKIE,
  //   maxAge: 24 * 60 * 60 * 1000,
  //   secure: true,
  //   httpOnly: true
  // }));

  // Use redis session
  expressApp.use(
    session({
      store: new RedisStore({
        client: redisClient,
        prefix: 'client_api:'
      }),
      resave: false,
      saveUninitialized: false,
      secret: API_COOKIE
    })
  )

  console.log('Setting cookie parser');
  // Enable cookie parsing to read keycloak token
  expressApp.use(cookieParser());

  console.log('Setting express JSON');
  expressApp.use(express.json({ limit: '5mb' }));

  console.log('Setting passport session regen workaround');
  // Fix for passport/express cookie issue
  expressApp.use((req: Request, res: Response, next: NextFunction) => {
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

  console.log('Setting passport initialization');
  expressApp.use(passport.initialize());

  console.log('Setting passport session auth');
  expressApp.use(passport.authenticate('session'));

  const strategyResponder: StrategyVerifyCallbackUserInfo<StrategyUser> = (tokenSet, userInfo, done) => {
    const { sub } = tokenSet.claims();
    return done(null, { sub });
  }

  console.log('Awaiting issuer discovery');
  const keycloakIssuer = await Issuer.discover(keycloakDiscoveryUrl);

  console.log('Setting OIDC strategy');
  passport.use('oidc', new Strategy<StrategyUser>({
    client: new keycloakIssuer.Client(keycloakClientConfiguration)
  }, strategyResponder));

  console.log('Setting user serialization');
  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  console.log('Setting user de-serialization');
  passport.deserializeUser<Express.User>(function (user, done) {
    done(null, user);
  });

}