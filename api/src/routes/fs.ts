import { Express } from 'express';

import { IGroup, RateLimitResource } from 'awayto/core';
import { IDatabase } from 'pg-promise';

export default function buildFsRoutes(app: Express, dbClient: IDatabase<unknown>, rateLimitResource: RateLimitResource): void {

  app.get('/api/fs/dl/:token', async (req, res) => {
    // try {
    //   const { token } = req.params;

    //   const file = await new Promise(res => {
    //     setTimeout(() => {res([1,2,3,4,5])}, 1000);
    //   });
      

    //   if (await rateLimitResource(req.headers['x-forwarded-for'] as string, `/kiosk/gs/${name}`, 1, 59)) {
    //     return res.status(429).send('Rate limit exceeded.').end();
    //   }

    //   const data = await dbClient.oneOrNone<IGroup>(`
    //     SELECT *
    //     FROM dbview_schema.kiosk_schedule
    //     WHERE name = $1
    //   `, [name]);

    //   return res.setHeader('content-type', 'application/json').status(200).send(JSON.stringify({ ...data, updatedOn: new Date(updatedOn).toISOString() })).end();

    // } catch (err) {
    //   const error = err as Error;
    //   console.error('error fetching group schedule data', error);
    // }
  });
}