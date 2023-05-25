import express from 'express';

import { rateLimitResource } from '../modules/redis';

const router = express.Router();

router.get('/gs/:id.json', async (req, res) => {
  const { id } = req.params;

  if (await rateLimitResource(`/gs/${id}`, req.headers['x-forwarded-for'] as string, 1, 10)) {
    return res.status(429).send('Rate limit exceeded.');
  }

  return res.setHeader('content-type', 'application/json').status(200).send(JSON.stringify({ yo: true }));
});

export default router;