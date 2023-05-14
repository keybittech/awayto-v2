import express from 'express';
import passport from 'passport';
import { v4 as uuid } from 'uuid';

import { db } from '../modules/db';
import logger from '../modules/logger';
import redis, { redisProxy } from '../modules/redis';
import { saveFile, putFile, getFile } from '../modules/fs';
import keycloak from '../modules/keycloak';

import { checkBackchannel, checkAuthenticated } from '../middlewares';

import WebHooks from '../webhooks/index';

import { useAi } from '@keybittech/wizapp/dist/server';

import { AuthBody, AuthProps, IGroup } from 'awayto/core';

const router = express.Router();

router.post('/register/validate', checkBackchannel, async (req, res) => {
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

router.get('/checkin', (req, res, next) => {
  passport.authenticate('oidc')(req, res, next);
});

router.get('/login/callback', (req, res, next) => {
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

router.get('/checkok', checkAuthenticated, (req, res, next) => {
  res.status(200).end();
});

router.get('/checkfail', (req, res, next) => {
  res.status(403).end();
});

router.post('/webhook', checkBackchannel, async (req, res) => {
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
        fs: { saveFile, putFile, getFile },
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

export default router;