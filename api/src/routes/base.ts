import express, { RequestHandler, Request, Response } from 'express';
import jwtDecode from 'jwt-decode';
import { IdTokenClaims } from 'openid-client';

import { db } from '../modules/db';
import logger from '../modules/logger';
import redis, { redisProxy, rateLimitResource, DEFAULT_THROTTLE } from '../modules/redis';
import { saveFile, putFile, getFile } from '../modules/fs';
import keycloak from '../modules/keycloak';
import { getGroupRegistrationRedirectParts } from '../modules/keycloak';

import { checkAuthenticated, validateRequestBody } from '../middlewares';

import { useAi } from '@keybittech/wizapp/dist/server';

import {
  DecodedJWTToken,
  UserGroupRoles,
  StrategyUser,
  ApiErrorResponse,
  siteApiRef,
  ApiProps,
  EndpointType,
  AnyRecord,
  AnyRecordTypes,
  BufferResponse,
  nid,
  HttpMethodsLC
} from 'awayto/core';

import { siteApiHandlerRef } from '../handlers';

const router = express.Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// default protected route /test
router.get('/join/:groupCode', async (req, res) => {
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

for (const apiRefId in siteApiRef) {
  const { method, url, queryArg, resultType, kind, opts: { cache, throttle, contentType } } = siteApiRef[apiRefId as keyof typeof siteApiRef];
  const isFileContent = 'application/octet-stream' === contentType;

  const requestHandlers: RequestHandler[] = [ checkAuthenticated ];

  if (isFileContent) {
    requestHandlers.push(express.raw({ type: contentType, limit: '4mb' }));
  }

  requestHandlers.push(validateRequestBody(queryArg, url));

  // Here we make use of the extra /api from the reverse proxy
  router[<HttpMethodsLC>method.toLowerCase()](`/${url.split('?')[0]}`, requestHandlers, async (req: Request, res: Response) => {

    const requestId = nid('v4');
    const user = req.user as StrategyUser;

    if ('skip' !== throttle && ((throttle || EndpointType.MUTATION === kind) && await rateLimitResource(user.sub, `${method}/${url}`, 1, throttle))) {
      return res.status(429).send({ reason: 'You must wait ' + (throttle || DEFAULT_THROTTLE) + ' seconds.', requestId });
    }

    if (await rateLimitResource(user.sub, 'api', 30, 1)) { // limit n general api requests per second
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
        if (!req.headers.authorization) throw { reason: 'No auth.' };

        const xfwd = (req.headers['x-forwarded-for'] as string).split('.');
        const sourceIp = xfwd.filter((a, i) => i !== xfwd.length - 1).join('.') + '.000';
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
          fs: { saveFile, putFile, getFile },
          ai: { useAi },
          logger,
          event: {
            requestId,
            method,
            url,
            public: false,
            groups: token.groups,
            availableUserGroupRoles: tokenGroupRoles,
            userSub: user.sub,
            sourceIp,
            pathParameters: req.params as Record<string, string>,
            queryParameters: req.query as Record<string, string>,
            body: req.body as typeof queryArg
          }
        } as ApiProps<typeof queryArg>;

        const handler = siteApiHandlerRef[apiRefId as keyof typeof siteApiRef];

        const txHandler = async <T, Q extends AnyRecord | AnyRecordTypes>(props: ApiProps<Q>): Promise<T> => {
          const eventLength = JSON.stringify(requestParams.event).length;
          const handlerType = EndpointType.MUTATION === kind ? 'mutation': 'query';
          const { body, ...logged } = requestParams.event;
          logger.log(`Handling api ${handlerType} with size ` + eventLength, {
            ...logged,
            body: isFileContent ? undefined : body
          });
          console.log('handling', handlerType, method, url, user.sub, requestId, eventLength);

          if (EndpointType.MUTATION === kind) {
            return await db.tx(async trx => {
              requestParams.tx = trx;
              return await (handler as (props: ApiProps<Q>) => Promise<T>)(props);
            });
          }

          return await (handler as (props: ApiProps<Q>) => Promise<T>)(props);
        }

        response = await txHandler<typeof resultType, typeof queryArg>(requestParams);

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

    if (typeof response === 'object' && (response as BufferResponse).buffer instanceof ArrayBuffer) {
      const { name, buffer } = response as BufferResponse;
      res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(Buffer.from(buffer));
    } else if (!!response || 'object' === typeof response && Object.keys(response).length) {
      // Respond
      res.status(200).json(response);
    } else {
      res.status(500).send({ reason: 'Cannot process request', requestId })
    }
  });
}

export default router;