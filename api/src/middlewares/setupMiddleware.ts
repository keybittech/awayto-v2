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
  app.set('trust proxy', true);


  // Store keycloak token in session
  app.use(cookieSession({
    name: 'primary_session',
    secret: API_COOKIE,
    maxAge: 24 * 60 * 60 * 1000,
    secure: true,
    httpOnly: true
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
    const { sub } = tokenSet.claims();
    return done(null, { sub });
  }

  const keycloakIssuer = await Issuer.discover(keycloakDiscoveryUrl);

  passport.use('oidc', new Strategy<StrategyUser>({
    client: new keycloakIssuer.Client(keycloakClientConfiguration)
  }, strategyResponder));

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser<Express.User>(function (user, done) {
    done(null, user);
  });

}