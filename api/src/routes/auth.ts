import fetch from 'node-fetch';
import type { Express } from 'express';
import passport from 'passport';
import { v4 as uuid } from 'uuid';
import { IDatabase } from 'pg-promise';
import { Redis } from 'ioredis';
import { graylog } from 'graylog2';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';

import { useAi } from '@keybittech/wizapp/dist/server';

import { saveFile, putFile, getFile } from '../modules/fs';

import { checkBackchannel, checkAuthenticated } from '../middlewares';

import WebHooks from '../webhooks/index';

import { AuthBody, IGroup, KcSiteOpts, RateLimitResource, RedisProxy } from 'awayto/core';

const {
  CUST_APP_HOSTNAME
} = process.env as { [prop: string]: string };

export default function buildAuthRoutes(app: Express, dbClient: IDatabase<unknown>, redisClient: Redis, graylogClient: graylog, keycloakClient: KeycloakAdminClient & KcSiteOpts, redisProxy: RedisProxy, rateLimitResource: RateLimitResource): void {

  app.post('/api/auth/register/validate', checkBackchannel, async (req, res) => {
    try {
      const group = await dbClient.one<IGroup>(`
        SELECT allowed_domains "allowedDomains", display_name as name
        FROM dbtable_schema.groups
        WHERE enabled = true AND code = $1
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
    if (!req.session[`oidc:${CUST_APP_HOSTNAME}`]) {
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

      // console.log('/api/auth/webhook', JSON.stringify(body, null, 2));

      // Create trace event
      const event = {
        requestId,
        method: 'POST',
        url: '/api/auth/webhook',
        username: details.username || '',
        public: false,
        userSub: userId,
        sourceIp: ipAddress,
        group: {},
        availableUserGroupRoles: {},
        pathParameters: req.params,
        queryParameters: req.query as Record<string, string>,
        body
      };

      await dbClient.tx(async tx => {
        await WebHooks[`AUTH_${type}`]({
          event,
          db: dbClient,
          redis: redisClient,
          keycloak: keycloakClient,
          logger: graylogClient,
          redisProxy,
          tx,
          fetch,
          rateLimitResource,
          fs: { saveFile, putFile, getFile },
          ai: { useAi },
        });
      });

      res.status(200).send({});
    } catch (error) {
      const err = error as Error & { reason: string };

      console.log('auth webhook error', err);
      graylogClient.log('error response', { requestId, error: err });

      // Handle failures
      res.status(500).send({
        requestId,
        reason: err.reason || err.message
      });
    }
  });
}
