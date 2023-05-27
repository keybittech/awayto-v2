import express from 'express';

import { db } from '../modules/db';

import { rateLimitResource } from '../modules/redis';

const router = express.Router();

router.get('/gs/:id.json', async (req, res) => {
  try {
    const { id } = req.params;

    if (await rateLimitResource(req.headers['x-forwarded-for'] as string, `/kiosk/gs/${id}`, 1, 10)) {
      return res.status(429).send('Rate limit exceeded.');
    }
  
    const data = await db.manyOrNone<Record<string, string>>(`
      SELECT *
      FROM dbview_schema.kiosk_schedule
    `);
  
    return res.setHeader('content-type', 'application/json').status(200).send(JSON.stringify(data));
  
  } catch (err) {
    const error = err as Error;
    console.error('error fetching group schedule data', error);
  }
});

setInterval(async () => {
  try {
    console.log('refreshing kiosk view');
    await db.none(`REFRESH MATERIALIZED VIEW dbview_schema.kiosk_schedule`);
  } catch (err) {
    const error = err as Error;
    console.error('error refreshing group schedule view', error)
  }
}, 60000)

export default router;