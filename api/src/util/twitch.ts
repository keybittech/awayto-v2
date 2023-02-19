import WebSocket from 'ws';
import WebHooks from '../webhooks/index';
import { v4 as uuid } from 'uuid';
import fetch from 'node-fetch';

const {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  TWITCH_CLIENT_ACCESS_TOKEN
} = process.env as { [prop: string]: string }


async function go() {

  try {

    const tokenData = [{
      name: 'client_id',
      value: TWITCH_CLIENT_ID
    },{
      name: 'client_secret',
      value: TWITCH_CLIENT_SECRET
    }, {
      name: 'grant_type',
      value: 'client_credentials'
    }];

    const tokenRequest = await fetch('https://id.twitch.tv/oauth2/token', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      method: 'POST',
      body: tokenData.map(d => `${encodeURIComponent(d.name)}=${encodeURIComponent(d.value)}`).join('&')
    });

    const { access_token } = await tokenRequest.json() as { access_token: string };

    const headers = {
      headers: {
        'Authorization': 'Bearer ' + access_token,
        'Client-Id': TWITCH_CLIENT_ID
      }
    }

    const userCall = await fetch('https://api.twitch.tv/helix/users', headers);

    if (userCall.ok) {
      const { data: [user] } = await userCall.json() as { data: Record<string, string>[] };

      const rewardCall = await fetch(`https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${user.id}`, headers);


      if (rewardCall.ok) {
        const rewards: Record<string, Record<string, string>> = {};
        const { data: rewardArray } = await rewardCall.json() as { data: Record<string, string>[] };

        rewardArray.forEach(reward => {
          rewards[reward.id] = reward;
        });

        const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
  
        ws.on('error', console.error);
    
        ws.on('open', async function () {
          console.log('connection open');
          ws.send('CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands')
          ws.send(`PASS oauth:${TWITCH_CLIENT_ACCESS_TOKEN}`);
          ws.send(`NICK chatjoept`);
          ws.send('JOIN #chatjoept');
        });
    
        ws.on('message', async function (data: Buffer) {
          const body = data.toString();
          const contents: Record<string, string> = {};
    
    
          console.log(body);
    
          if (data.includes(' PRIVMSG #chatjoept :')) {
            const [payload, message] = body.split(" PRIVMSG #chatjoept :");
            const payloadItems = payload.slice(1).split(';');
    
            contents['message'] = message.trimEnd();
            payloadItems.forEach(item => {
              const [key, value] = item.split('=');
              contents[key.replace(/-./g, x => x[1].toUpperCase())] = value;
            });
    
            console.log(contents);

            const requestId = uuid();

            const event = {
              requestId,
              method: 'POST',
              path: '/api/twitch/listener',
              username: contents.displayName,
              public: false,
              userSub: '',
              sourceIp: '',
              availableUserGroupRoles: {},
              pathParameters: {},
              queryParameters: {},
              body: contents
            }
    
            if (rewards[contents.customRewardId]) {
              
              await WebHooks[`CHANNEL_POINT_REDEMPTION`]({ event });
            }
    
    
          }
    
        });
      }

    }
    

  } catch (error) {
    console.log({ error })
  }
}

void go();
