import cookieParser from 'cookie-parser';
import cookieSession from 'cookie-session';
import passport from 'passport';
import express, { Request, Response, NextFunction, Express } from 'express';
import { Strategy, StrategyVerifyCallbackUserInfo } from 'openid-client';
import { StrategyUser } from 'awayto/core';

import keycloak from '../modules/keycloak';

const {
  API_COOKIE
} = process.env as { [prop: string]: string };

export const setupMiddleware = (app: Express) => {
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

    const { preferred_username: username, sub } = tokenSet.claims();

    const userProfileClaims: StrategyUser = {
      username,
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

}