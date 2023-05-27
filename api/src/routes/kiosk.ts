import express from 'express';

import { db } from '../modules/db';

import { rateLimitResource } from '../modules/redis';
import { IGroup } from 'awayto/core';

const router = express.Router();

let updatedOn = (new Date()).toISOString();

router.get('/gs/:name.json', async (req, res) => {
  try {
    const { name } = req.params;

    if (await rateLimitResource(req.headers['x-forwarded-for'] as string, `/kiosk/gs/${name}`, 1, 59)) {
      return res.status(429).send('Rate limit exceeded.').end();
    }
  
    const data = await db.oneOrNone<IGroup>(`
      SELECT *
      FROM dbview_schema.kiosk_schedule
      WHERE name = $1
    `, [name]);
  
    return res.setHeader('content-type', 'application/json').status(200).send(JSON.stringify({ ...data, updatedOn })).end();
  
  } catch (err) {
    const error = err as Error;
    console.error('error fetching group schedule data', error);
  }
});

setInterval(async () => {
  try {
    console.log('refreshing kiosk view');
    updatedOn = (new Date()).toISOString();
    await db.none(`REFRESH MATERIALIZED VIEW dbview_schema.kiosk_schedule`);
  } catch (err) {
    const error = err as Error;
    console.error('error refreshing group schedule view', error)
  }
}, 60 * 1000)

export default router;