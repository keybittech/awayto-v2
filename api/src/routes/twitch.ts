import path from 'path';
import express from 'express';

import redis from '../modules/redis';
import { TWITCH_REDIRECT_URI } from '../modules/twitch';

const {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET
} = process.env as { [prop: string]: string };

const router = express.Router();

router.get('/webhook', async (req, res, next) => {
  try {
    const { code, access_token } = req.query;

    if (access_token) {
      await redis.set('client_access_token', access_token as string);
    } else if (code) {

      const tokenData = [{
        name: 'client_id',
        value: TWITCH_CLIENT_ID
      }, {
        name: 'client_secret',
        value: TWITCH_CLIENT_SECRET
      }, {
        name: 'code',
        value: code
      }, {
        name: 'grant_type',
        value: 'authorization_code'
      }, {
        name: 'redirect_uri',
        value: TWITCH_REDIRECT_URI
      }];

      const tokenRequest = await fetch('https://id.twitch.tv/oauth2/token', {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: tokenData.map(d => `${encodeURIComponent(d.name)}=${encodeURIComponent(d.value as string)}`).join('&')
      });

      const { access_token: new_access_token, refresh_token } = await tokenRequest.json() as { access_token: string, refresh_token: string };

      await redis.set('twitch_token', new_access_token as string);
      await redis.set('twitch_refresh', refresh_token as string);
    }
    
    res.status(200).send();
  } catch (error) {
    console.log('twitch webhook error', error)
  }

});

router.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, '../src/modules/twitch_events.html'));
});

export default router;