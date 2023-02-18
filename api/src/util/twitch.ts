import WebSocket from 'ws';

const {
  TWITCH_CLIENT_ACCESS_TOKEN
} = process.env as { [prop:string]: string }

async function go() {

  try {
    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

    ws.on('error', console.error);

    ws.on('open', async function() {
      console.log('connection open');
      ws.send('CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands')
      ws.send(`PASS oauth:${TWITCH_CLIENT_ACCESS_TOKEN}`);
      ws.send(`NICK chatjoept`);
      ws.send('JOIN #chatjoept');
    });

    ws.on('message', function(data: Buffer) {
      const body = data.toString();
      const contents: Record<string, string> = {};

      console.log(body);

      if (data.includes('PRIVMSG')) {
        const [payload, message] = body.split(" PRIVMSG ");
        const payloadItems = payload.slice(1).split(';');

        contents['message'] = message.trimEnd();
        payloadItems.forEach(item => {
          const [key, value] = item.split('=');
          contents[key.replace(/-./g, x=>x[1].toUpperCase())] = value;
        });

        console.log(contents);
      }

    });

  } catch (error) {
    console.log({ error })
  }
}

void go();
