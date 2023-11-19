import { Express } from 'express';

import { IGroup, RateLimitResource } from 'awayto/core';
import { IDatabase } from 'pg-promise';

let updatedOn = Date.now();
export default function buildKioskRoutes(app: Express, dbClient: IDatabase<unknown>, rateLimitResource: RateLimitResource): void {

  app.get('/api/kiosk/gs/:name.json', async (req, res) => {
    try {
      const { name } = req.params;

      if (await rateLimitResource(req.headers['x-forwarded-for'] as string, `/kiosk/gs/${name}`, 1, 59)) {
        return res.status(429).send('Rate limit exceeded.').end();
      }

      if (updatedOn < Date.now() - 60000) {
        updatedOn = Date.now();
        await dbClient.none(`REFRESH MATERIALIZED VIEW dbview_schema.kiosk_schedule`);
      }

      const data = await dbClient.oneOrNone<IGroup>(`
        SELECT *
        FROM dbview_schema.kiosk_schedule
        WHERE name = $1
      `, [name]);

      return res.setHeader('content-type', 'application/json').status(200).send(JSON.stringify({ ...data, updatedOn: new Date(updatedOn).toISOString() })).end();

    } catch (err) {
      const error = err as Error;
      console.error('error fetching group schedule data', error);
    }
  });
}