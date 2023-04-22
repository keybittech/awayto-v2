import * as WebSocket from 'ws';
import * as https from 'https';
import fetch from 'node-fetch';
import fs from 'fs';
import redis from './redis';
import { generatePrompt, generatePromptHistory, getChatCompletionPrompt, getChatCompletionPromptFromHistory, GuidedEditKeys, GuidedEditResponse, useAi } from './openai';
import { extractCodeBlock, isValidName, toSnakeCase, toTitleCase, sanitizeBranchName, IPrompts } from 'awayto/core';
import path from 'path';
import { FunctionDeclaration, JsxElement, Node, Project, ScriptKind, SourceFile, SyntaxKind } from 'ts-morph';
import simpleGit from 'simple-git';
import { execSync } from 'child_process';

const {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  TWITCH_CLIENT_ACCESS_TOKEN
} = process.env as { [prop: string]: string }

export const TWITCH_REDIRECT_URI = 'https://wcapp.site.com/api/twitch/webhook'

export async function connectToTwitch(httpsServer: https.Server) {

  const localSocketServer = new WebSocket.WebSocketServer({ server: httpsServer });

  localSocketServer.on('connection', (localSocket) => {
    console.log('Client connected');
    localSocket.send(JSON.stringify({ message: 'TWITCH CONNECTED' }))

    localSocket.on('message', message => {
      const msg = JSON.parse(message.toString()) as { action: string, command: string, message: string };
      console.log(msg)

    });
  });

  try {

    let server_access_token = await redis.get('twitch_token');

    while (!server_access_token) {
      await new Promise(res => setTimeout(res, 5000))
      console.log(`Twitch login required https://id.twitch.tv/oauth2/authorize?client_id=${TWITCH_CLIENT_ID}&redirect_uri=${encodeURIComponent(TWITCH_REDIRECT_URI)}&response_type=code&scope=channel:read:redemptions`);
      server_access_token = await redis.get('twitch_token');
    }

    const tokenData = [{
      name: 'client_id',
      value: TWITCH_CLIENT_ID
    }, {
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

    const { access_token: user_access_token } = await tokenRequest.json() as { access_token: string };

    const headers = {
      headers: {
        'Authorization': 'Bearer ' + user_access_token,
        'Client-Id': TWITCH_CLIENT_ID,
        'Accept': 'application/vnd.twitchtv.v5+json'
      }
    }

    const userName = 'ChatJOEPT';
    const userCall = await fetch(`https://api.twitch.tv/helix/users?login=${encodeURIComponent(userName)}`, headers);


    if (userCall.ok) {
      const { data: [user] } = await userCall.json() as { data: Record<string, string>[] };

      const headers = {
        headers: {
          'Authorization': 'Bearer ' + server_access_token,
          'Client-Id': TWITCH_CLIENT_ID,
          'Accept': 'application/vnd.twitchtv.v5+json'
        }
      }

      const rewardCall = await fetchWithTokenRefresh(`https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${user.id}`, headers);


      if (rewardCall.ok) {
        const rewards: Record<string, Record<string, string>> = {};
        const { data: rewardArray } = await rewardCall.json() as { data: Record<string, string>[] };

        rewardArray.forEach(reward => {
          rewards[reward.id] = reward;
        });

        console.log({ rewards: rewardArray.map(r => r.title) })

        const ws = new WebSocket.WebSocket("wss://irc-ws.chat.twitch.tv:443");

        setInterval(() => {
          ws.send("PING :tmi.twitch.tv");
        }, 1 * 60 * 1000);

        ws.on('error', console.error);

        ws.on('open', async function () {
          ws.send('CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands')
          ws.send(`PASS oauth:${TWITCH_CLIENT_ACCESS_TOKEN}`);
          ws.send(`NICK chatjoept`);
          ws.send('JOIN #chatjoept');
        });

        let open = false;

        ws.on('message', async function (data: Buffer) {
          if (!open) {
            open = true;
            console.log('connection open');
            console.log('Open events at http://wcapp.site.com/api/twitch/events');
            localSocketServer.clients.forEach((localSocket) => {
              if (localSocket.readyState == 1) {
                localSocket.send(JSON.stringify({ message: 'CHAT CONNECTED' }));
              }
            });
          }

          try {
            const body = data.toString();
            const contents: Record<string, string> = {};

            console.log({ body })

            if (body.startsWith(":tmi.twitch.tv PONG")) {
              console.log("Received PONG from Twitch IRC server");
              return;
            }

            console.log(body)

            if (data.includes(' JOIN #chatjoept')) {
              contents.action = 'join';
              contents.username = data.toString().split('!')[0].slice(1);
            }

            if (data.includes(' PART #chatjoept')) {
              contents.action = 'part';
              contents.username = data.toString().split('!')[0].slice(1);
            }

            if (data.includes(' PRIVMSG #chatjoept :')) {
              const [payload, message] = body.split(" PRIVMSG #chatjoept :");
              let messageBuilder = message;
              const payloadItems = payload.slice(1).split(';');

              payloadItems.forEach(item => {
                const [key, value] = item.split('=');
                contents[key.replace(/-./g, x => x[1].toUpperCase())] = value;
              });

              console.log({ contents })

              if (contents.customRewardId) {
                if ('Skip TTS' === rewards[contents.customRewardId].title) {
                  contents.action = 'skip';
                  messageBuilder = 'skipped the poor bastard, ' + messageBuilder
                }

                if ('Generate API' === rewards[contents.customRewardId].title) {
                  messageBuilder = await generateApi(messageBuilder.trimEnd(), contents.displayName);
                }

                if ('Generate Component' === rewards[contents.customRewardId].title) {
                  messageBuilder = await createComponent(messageBuilder.trimEnd(), contents.displayName);
                }

                if ('Edit File' === rewards[contents.customRewardId].title) {
                  messageBuilder = await mirrorEdit(messageBuilder.trimEnd(), contents.displayName);
                }

                contents.message = createWordMix(contents.displayName, messageBuilder.trimEnd());
              }
            }

            if (Object.keys(contents).length) {
              localSocketServer.clients.forEach((localSocket) => {
                if (localSocket.readyState == 1) {
                  localSocket.send(JSON.stringify(contents));
                }
              });
            }
          } catch (error) {
            console.log('CRITICAL TWITCH MESSAGE ERROR', error)
          }

        });
      }
    }
  } catch (error) {
    console.log({ error })
  }
}

async function getToken() {
  const access_token = await redis.get('twitch_token');
  const refresh_token = await redis.get('twitch_refresh');
  return { access_token, refresh_token };
}

async function storeToken(tokens: { access_token: string, refresh_token: string }) {
  await redis.set('twitch_token', tokens.access_token);
  await redis.set('twitch_refresh', tokens.refresh_token);
  return tokens;
}

async function refreshToken(refreshToken: string) {
  const refreshTokenData = [
    { name: "client_id", value: TWITCH_CLIENT_ID },
    { name: "client_secret", value: TWITCH_CLIENT_SECRET },
    { name: "grant_type", value: "refresh_token" },
    { name: "refresh_token", value: refreshToken },
  ];

  const tokenRequest = await fetch("https://id.twitch.tv/oauth2/token", {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    method: "POST",
    body: refreshTokenData.map(d => `${encodeURIComponent(d.name)}=${encodeURIComponent(d.value)}`).join("&"),
  });

  return await tokenRequest.json() as { access_token: string, refresh_token: string };
}

const fetchWithTokenRefresh: typeof fetch = async (url, options) => {
  const { access_token, refresh_token } = await getToken();

  const headers = {
    ...options?.headers,
    Authorization: "Bearer " + access_token,
    "Client-Id": TWITCH_CLIENT_ID,
    Accept: "application/vnd.twitchtv.v5+json",
  };

  const response = await fetch(url, { ...options, headers });

  // Check if the API call failed due to token expiration (status code 401)
  if (response.status === 401 && refresh_token) {
    // Attempt to refresh the access token
    const newTokenData = await refreshToken(refresh_token);

    // Store the new access_token and refresh_token
    await storeToken(newTokenData);

    // Retry the API call with the new access_token
    const newHeaders = {
      ...options?.headers,
      Authorization: "Bearer " + newTokenData.access_token,
      "Client-Id": TWITCH_CLIENT_ID,
      Accept: "application/vnd.twitchtv.v5+json",
    };

    return await fetch(url, { ...options, headers: newHeaders });
  }

  return response;
}



type Preposition = string;
type Location = string;
type AnimalSituation = string;

const physicalPrepositions: Preposition[] = [
  "in",
  "on",
  "at",
  "inside",
  "outside",
  "above",
  "below",
  "near",
];

const physicalLocations: Location[] = [
  "a bouncy castle",
  "the International Space Station",
  "the top of the Big Ben",
  "the middle of the earth's core",
  "a haunted house",
  "a roller coaster",
  "a parade of penguins",
  "a hot air balloon",
  "an inflatable castle",
  "inside a colossal shoe",
  "a cheese-scented sauna",
  "a confetti-filled cave",
  "a polka-dotted pyramid",
  "on a trampoline island",
  "a room of bouncy walls",
  "inside a giant pickle",
  "an upside-down building",
  "in a spiderweb hammock",
  "a bathtub full of salsa",
  "on a tightrope of licorice",
  "a garden of carnivorous plants",
  "a maze of velvet curtains",
  "a mirror maze of selfies",
  "a jungle gym of noodles",
  "on a pizza-shaped planet",
  "a room full of rubber ducks",
  "inside a giant clam",
  "a velvet-lined crater",
  "a mountain of ice cream",
  "a field of ticklish grass",
  "a chocolate waterfall",
  "a beach of whipped cream",
  "a kaleidoscopic cavern",
  "a village of teapots",
  "in a pillow fort dungeon",
  "a carousel of cacti",
  "a roller coaster of spaghetti",
  "a city of marshmallow buildings",
  "in a popcorn storm",
  "a holographic concert",
  "inside a pinball machine",
  "a world of edible furniture",
  "a planet of dancing statues",
  "a volcano of confetti",
  "a land of musical plants",
  "on a spinning disco ball",
  "in a cave of glowworms",
  "a field of glittering dandelions",
  "a giant jelly trampoline",
  "a skyscraper of pancakes",
  "a labyrinth of lava lamps",
  "a stadium of singing fish",
  "a park of neon trees",
  "a river of rainbow milk",
  "a cloud made of cotton candy",
  "a playground of bubbles",
  "a desert of powdered sugar",
  "an escalator to nowhere",
  "a town of gingerbread houses",
  "a pond of sparkling lemonade",
  "a snowglobe village",
  "a city of floating umbrellas",
  "a tunnel of hugging teddy bears",
  "a castle made of cake",
  "a canyon of toothpaste",
  "a forest of rubber trees",
  "a slippery slopes water park",
  "a mountain of pillows",
  "an island of fuzzy creatures",
  "a treehouse nightclub",
  "a floating sushi bar",
  "a cave of bouncy stalactites",
  "a canyon of velvet",
  "a tunnel of disco lights",
  "a field of bouncing mushrooms",
  "a train of roller skates",
  "a world of origami",
  "a sky full of kites",
  "a moon made of cheese",
  "a disco in the jungle",
  "a theater of shadows",
  "a library of whispers",
  "a room of laughing portraits",
  "a waterfall of pearls",
  "a blanket fort city",
  "a river of fruit punch",
  "an island of flamingos",
  "a valley of giant flowers",
  "a cloud of shimmering mist",
  "a temple of mirrors",
  "a sunken ship casino",
  "a garden of bubble sculptures",
  "a city of glass",
  "a museum of illusions",
  "a paper airplane airport",
  "a forest of bioluminescent fungi",
  "a treetop village",
  "a beach of rainbow sand",
];

const animalPrepositions: Preposition[] = [
  "riding",
  "chasing",
  "being chased by",
  "hugging",
  "wrestling",
  "feeding",
  "walking",
  "petting",
  "outsmarting",
  "racing",
  "mimicking",
  "serenading",
  "carrying",
  "juggling",
  "massaging",
  "doing yoga with",
  "meditating with",
  "teaching",
  "learning from",
  "arguing with",
  "singing with",
  "synchronized swimming with",
  "dancing with",
  "playing chess against",
  "painting",
];

const animalSituations: AnimalSituation[] = [
  "a zebra",
  "a kangaroo",
  "a group of llamas",
  "an ostrich",
  "a giant tortoise",
  "a curious raccoon",
  "a sleepy sloth",
  "a playful otter",
  "a mischievous monkey",
  "an energetic bunny",
  "an acrobatic squirrel",
  "a philosophical owl",
  "a determined ant",
  "a mysterious octopus",
  "a friendly dolphin",
  "a protective mama bear",
  "a cunning fox",
  "a lovable elephant",
  "a brave lion",
  "a majestic eagle",
  "a gentle giraffe",
  "a quirky puffin",
  "a curious meerkat",
  "a waddling platypus",
  "a sassy seagull",
];

const situationalPhrases: string[] = [
  "while surfing on a wave of lava",
  "during a breakdance battle",
  "as he sinks in quicksand",
  "dressed as a giant chicken",
  "floating in a pool filled with jello",
  "while riding a unicycle",
  "midway through a pie-eating contest",
  "as he's abducted by aliens",
  "during a close encounter with a yeti",
  "inside a giant sandwich",
  "wearing a tutu",
  "in zero gravity",
  "during a snowstorm in July",
  "while juggling pineapples",
  "on a runaway treadmill",
  "in a world made of candy",
  "surrounded by talking plants",
  "inside a soap bubble",
  "during an alien invasion",
  "in a deep-sea diving suit",
  "in a land of unicorns",
  "wrapped in a burrito blanket",
  "wearing spaghetti as a wig",
  "on a flying skateboard",
  "in an igloo on the beach",
  "covered in a mountain of pillows",
  "as a mime in a glass box",
  "in a room full of mirrors",
  "floating in a sea of soda",
  "wearing a suit of armor",
  "in a world of giants",
  "on an island of sentient cheese",
  "during a surprise musical",
  "as a human disco ball",
  "inside a tornado of cats",
  "on a trampoline of marshmallows",
  "dancing with a robot",
  "swimming in a pool of chocolate",
  "hiding in a pile of leaves",
  "being followed by a rain cloud",
  "wearing shoes made of bread",
  "in a house of playing cards",
  "with a squad of superhero squirrels",
  "in a forest of giant mushrooms",
  "on a cloud of cotton candy",
  "during a moonwalk competition",
  "inside a kaleidoscope",
  "wearing a suit of bubble wrap",
  "on a planet of sentient fruit",
  "in an underwater city",
  "in a room full of balloons",
  "while riding a giant snail",
  "during a ninja showdown",
  "on a carousel of unicorns",
  "swarmed by butterflies",
  "trapped in a jar of pickles",
  "in a town of anthropomorphic animals",
  "in an elevator full of clowns",
  "on a parade float of kittens",
];

function getRandomElement<T>(arr: T[]): T {
  const randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

function createWordMix(user: string, johnsMessage: string): string {
  const randomChoice = Math.floor(Math.random() * 3);

  if (randomChoice === 0) {
    const randomPhysicalPreposition = getRandomElement(physicalPrepositions);
    const randomPhysicalLocation = getRandomElement(physicalLocations);
    return `${user}, ${randomPhysicalPreposition} ${randomPhysicalLocation}, ${johnsMessage}`;
  } else if (randomChoice === 1) {
    const randomAnimalPreposition = getRandomElement(animalPrepositions);
    const randomAnimalSituation = getRandomElement(animalSituations);
    return `${user}, ${randomAnimalPreposition} ${randomAnimalSituation}, ${johnsMessage}`;
  } else {
    const randomSituationalPhrase = getRandomElement(situationalPhrases);
    return `${user}, ${randomSituationalPhrase}, ${johnsMessage}`;
  }
}