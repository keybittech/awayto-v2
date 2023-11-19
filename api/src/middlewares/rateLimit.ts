import { NextFunction, Request, Response } from 'express';
import { EndpointType, RateLimitResource, StrategyUser } from 'awayto/core';

export const rateLimit = (rateLimitResource: RateLimitResource, throttle: number | 'skip' | undefined, kind: string, method: string, url: string) => async (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as StrategyUser;
  
  if ('skip' !== throttle && ((throttle || EndpointType.MUTATION === kind) && await rateLimitResource(user.sub, `${method}/${url}`, 1, throttle))) {
    return res.status(429).send({ reason: 'You must wait ' + (throttle || 10) + ' seconds.' });
  }

  if (await rateLimitResource(user.sub, 'api', 30, 1)) { // limit n general api requests per second
    return res.status(429).send({ reason: 'Rate limit exceeded.' });
  }
  
  return next();
}