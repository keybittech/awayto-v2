import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import passport from 'passport';
import express, { Request, Response, NextFunction, Express } from 'express';
import { Strategy, StrategyVerifyCallbackUserInfo, Issuer } from 'openid-client';
import { StrategyUser } from 'awayto/core';

import { keycloakClientConfiguration, keycloakDiscoveryUrl } from '../modules/keycloak';

const {
  API_COOKIE
} = process.env as { [prop: string]: string };

export const setupMiddleware = async (app: Express) => {
  // Configure for reverse proxy
  console.log('Setting trust proxy');
  app.set('trust proxy', true);

  console.log('Setting cookie session secret');
  // Store keycloak token in session
  app.use(cookieSession({
    name: 'primary_session',
    secret: API_COOKIE,
    maxAge: 24 * 60 * 60 * 1000,
    secure: true,
    httpOnly: true
  }));

  console.log('Setting cookie parser');
  // Enable cookie parsing to read keycloak token
  app.use(cookieParser());

  console.log('Setting express JSON');
  app.use(express.json());

  console.log('Setting passport session regen workaround');
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

  console.log('Setting passport initialization');
  app.use(passport.initialize());

  console.log('Setting passport session auth');
  app.use(passport.authenticate('session'));

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