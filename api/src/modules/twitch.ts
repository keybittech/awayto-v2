import * as WebSocket from 'ws';
import * as https from 'https';
import fetch from 'node-fetch';
import fs from 'fs';
import redis from './redis';
import { generatePrompt, generatePromptHistory, getChatCompletionPrompt, getChatCompletionPromptFromHistory, getCompletionPrompt } from './openai';
import { IPrompts } from 'awayto/core';
import path from 'path';
import { FunctionDeclaration, JsxElement, Node, Project, ScriptKind, SourceFile, SyntaxKind, TextChange, VariableDeclaration } from 'ts-morph';
import { processSuggestion } from './suggest';
import simpleGit from 'simple-git';
import { execSync } from 'child_process';


// const quickProj = new Project({
//   tsConfigFilePath: './projectts.json'
// });

// const sourceFile = quickProj.getSourceFile('ManageFeedback.tsx');


// quickProj.getSourceFiles().map(f => f.getTypeAliases()).flat().filter(t => {
//   fs.appendFileSync('testert.json', `${typeDefinitionToSentence(t.getText())}\n`)
// });

function typeDefinitionToSentence(typeDefinition: string) {
  const typeNameMatch = typeDefinition.match(/export type (\w+)/);

  if (!typeNameMatch) {
    return 'Invalid type definition provided.';
  }

  const typeName = typeNameMatch[1];
  const properties = [];
  const propertyRegex = /(\w+)\s*:\s*([^;]+);/g;

  let match;
  while ((match = propertyRegex.exec(typeDefinition)) !== null) {
    properties.push({ key: match[1], type: match[2].trim().replace(/\s+/g, ' ') });
  }

  if (properties.length > 0) {
    const propertiesDescription = properties
      .map((property) => `${property.key} as a ${property.type}`)
      .join(', ');

    return `${typeName} defines ${propertiesDescription}.`;
  } else {
    const recordMatch = typeDefinition.match(/Record<(.+),\s*(.+)>/);
    if (recordMatch) {
      return `${typeName} is a Record ${recordMatch[1]} of ${recordMatch[2]}.`;
    }
  }

  return 'Unable to parse the type definition.';
}

// const action = {
//   type: 'removeHook',
//   payload: { hookName: 'useGetGroupsQuery' },
// };

// const changeSet = [
//   {
//     type: 'modifyReactComponent',
//     payload: {
//       componentName: 'GroupHome',
//       changes: [action],
//     },
//   },
// ] as ChangeSet;

// const project = new Project({
//   tsConfigFilePath: './projectts.json'
// });
// const sourceFile = project.createSourceFile('GroupHome.tsx', `
// import React from 'react';

// import Box from '@mui/material/Box';

// import ManageGroups from './ManageGroups';
// import { sh } from "'awayto/hooks'";

// export function GroupHome (props: IProps): JSX.Element {
//     const { data: groups, isLoading } = sh.useGetGroupsQuery();
//     const { data: groups, isLoading } = sh.useGetGroupsQuery();
//     return <Box mb={4}>
//     <ManageGroups {...props} />
//     </Box>
// }

// export default GroupHome;
// `);

// applyChangeSet(changeSet, sourceFile);
// console.log('CHANGE SET XXXXXXXXXXXXXXXXXXXXXXXXXXXX', sourceFile.getText());


const {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  TWITCH_CLIENT_ACCESS_TOKEN
} = process.env as { [prop: string]: string }

export const TWITCH_REDIRECT_URI = 'https://wcapp.site.com/api/twitch/webhook'

export async function connectToTwitch(httpsServer: https.Server) {

  const localsocketserver = new WebSocket.WebSocketServer({ server: httpsServer });

  localsocketserver.on('connection', (localsocket) => {
    console.log('Client connected');
    localsocket.send(JSON.stringify({ message: 'TWITCH CONNECTED' }))
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
          console.log('connection open');
          console.log('Open events at http://wcapp.site.com/api/twitch/events');
          localsocketserver.clients.forEach((localsocket) => {
            if (localsocket.readyState == 1) {
              localsocket.send(JSON.stringify({ message: 'CHAT CONNECTED' }));
            }
          });
          ws.send('CAP REQ :twitch.tv/membership twitch.tv/tags twitch.tv/commands')
          ws.send(`PASS oauth:${TWITCH_CLIENT_ACCESS_TOKEN}`);
          ws.send(`NICK chatjoept`);
          ws.send('JOIN #chatjoept');
        });

        ws.on('message', async function (data: Buffer) {
          try {
            const body = data.toString();
            const contents: Record<string, string> = {};

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
              localsocketserver.clients.forEach((localsocket) => {
                if (localsocket.readyState == 1) {
                  localsocket.send(JSON.stringify(contents));
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

const isValidName = (name: string): boolean => {
  const regex = /^I[A-Z][a-zA-Z]*$/;
  return regex.test(name);
};

const toSnakeCase = (name: string): string => {
  if (!isValidName(name)) {
    throw new Error("Invalid name format");
  }
  return name.substr(1).replace(/[A-Z]/g, (match) => `_${match.toLowerCase()}`).slice(1);
};

const toTitleCase = (name: string): string => {
  if (!isValidName(name)) {
    throw new Error("Invalid name format");
  }
  return name.substr(1).replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
};

function extractCodeBlock(inputString: string, languages: string[] = ['typescript', 'json', 'jsx', 'tsx']) {
  const langStartTag = (language: string) => language ? `\`\`\`${language}` : '```';
  const langEndTag = '```';

  for (const language of languages) {
    const startTag = langStartTag(language);
    if (inputString.includes(startTag)) {
      return inputString.split(startTag)[1].split(langEndTag)[0];
    }
  }

  if (inputString.includes('```')) {
    return inputString.split('```')[1];
  }

  if (inputString.includes('tsx')) {
    return inputString.split('tsx')[1];
  }

  return inputString;
};

async function createComponent(description: string, user: string) {

  const project = new Project({
    tsConfigFilePath: './projectts.json'
  });

  const createComponentPrompt = generatePromptHistory(IPrompts.CREATE_COMPONENT, description);

  console.log({ createComponentPrompt });

  const generatedTsx = extractCodeBlock(await getChatCompletionPromptFromHistory(createComponentPrompt));

  console.log({ generatedTsx })

  const sourceFile = project.createSourceFile('new_component.tsx', generatedTsx, { scriptKind: ScriptKind.JSX });

  const exAssignment = sourceFile.getExportAssignments().find(assignment => assignment.isExportEquals() === false);

  if (exAssignment) {
    const asExpression = exAssignment.getExpression();

    if (asExpression) {
      console.log({ asname: asExpression.getText() })

      const creatorComment = `/* Created by Twitch chatter ${user}, ${description} */\n`;

      fs.writeFileSync(path.join(__dirname, `../../app/website/src/modules/generated/${asExpression.getText()}.tsx`), `${creatorComment}${generatedTsx}`);
      return 'created a new componenet like an actual omega mega bro';
    }
  }

  return 'uh oh, spaghetti-ohs, it is time to check the logs';
}

function getStatementText(child: Node) {
  let parsedStatementText = child.getText();
  const parent = child.getParent();

  if (child.getKind() == SyntaxKind.VariableDeclaration && parent instanceof Node) {
    parsedStatementText = parent.getText();
  }
  return parsedStatementText;
}

const ignoredStatements = [SyntaxKind.TryStatement]

function walkNode(child: Node, i: number, parsedStatements: Record<string, string>, originalStatements: Map<string, string>) {
  const statementName = `statement_${i}`;

  console.log({ PARSING: statementName, OFTYPE: child.getKindName() })

  if (child instanceof FunctionDeclaration) {
    child.getStatements().forEach((descendant, index) => {
      walkNode(descendant, index + i, parsedStatements, originalStatements);
    })
  } else if (!ignoredStatements.includes(child.getKind())) {
    parsedStatements[statementName] = getStatementText(child);
    originalStatements.set(statementName, getStatementText(child));
  }
}

function removeTextOutsideBraces(input: string): string {
  const firstBraceIndex = input.indexOf('{');
  const lastBraceIndex = input.lastIndexOf('}');

  if (firstBraceIndex === -1 || lastBraceIndex === -1) {
    console.error("The input string doesn't contain the required braces.");
    return "";
  }

  return input.slice(firstBraceIndex, lastBraceIndex + 1);
}

async function mirrorEdit(fileParts: string, user: string) {
  const [fileName, ...suggestedEdits] = fileParts.split(' ');
  const suggestions = suggestedEdits.join(' ');


  const project = new Project({
    tsConfigFilePath: '../../project_diff/api/projectts.json'
  });
  const git = simpleGit('../../project_diff');

  const sourceFile = project.getSourceFiles().filter(sf => sf.getFilePath().toLowerCase().includes(fileName.toLowerCase()))[0];

  if (sourceFile) {
    const sourceFilePath = sourceFile.getFilePath().toString();

    if (sourceFile.getText().length > 10000) {
      return 'hol up, wait a minute, file too stronk';
    }

    const originalStatements: Map<string, string> = new Map();
    const parsedStatements: Record<string, string> = {};

    sourceFile.getStatements().forEach((statement, index) => {
      walkNode(statement, index, parsedStatements, originalStatements);
    });

    console.log({ parsedStatements })
    const mirrorGenerationPrompt = generatePromptHistory(IPrompts.MIRROR_EDIT, suggestions, JSON.stringify(parsedStatements));
    console.log({ mirrorGenerationPrompt })
    const generatedMirror = await getChatCompletionPromptFromHistory(mirrorGenerationPrompt);

    const indexOfBlock = generatedMirror.indexOf('```');

    if (!indexOfBlock) {
      return 'i can\'t believe it\'s not a block';
    }

    const generatedPretext = generatedMirror.slice(0, indexOfBlock - 1);
    const extractedMirror = extractCodeBlock(generatedMirror);


    console.log({ generatedMirror, extractedMirror })

    const generatedStatements = JSON.parse(extractedMirror) as Record<string, string>;

    console.log({ generatedStatements })

    let fileContent = sourceFile.getFullText();
    let fileModified = false;

    Object.keys(generatedStatements).forEach(statementKey => {
      if (['new_statement', 'newstatement', `statement_${originalStatements.size + 1}`].includes(statementKey)) {
        fileContent += `\n${generatedStatements[statementKey]} // generated by ${user}`;
        fileModified = true;
      } else {
        const originalStatement = originalStatements.get(statementKey);

        if (originalStatement) {
          const originalIndex = fileContent.indexOf(originalStatement);
  
          if (originalIndex >= 0 && originalStatement !== generatedStatements[statementKey]) {
            console.log({ REPLACING: originalStatement, WITH: generatedStatements[statementKey] })
            fileContent = fileContent.substring(0, originalIndex) + generatedStatements[statementKey] + fileContent.substring(originalIndex + originalStatement.length);
            fileModified = true;
          }
        }
      }
    });

    if (fileModified) {
      sourceFile.removeText();
      sourceFile.insertText(0, fileContent);
      sourceFile.saveSync();

      await project.save();

      const generationBranch = `generations/${user}/${fileName}`;
      await git.fetch();
      try {
        await git.checkoutBranch(generationBranch, 'origin/main');
      } catch (error) {
        const err = error as Error;
        if (err.message.includes('A branch named') && err.message.includes('already exists')) {
          await git.checkout(generationBranch);
        }
      }
      await git.add(sourceFilePath);
      await git.commit(`${user.slice(0,15)} - ${suggestions.slice(0, 30)}`)
      await git.push('origin', generationBranch);
      execSync(`gh pr create --title "${user} edited ${fileName}" --body "${user} suggested: ${suggestions} \n\n GPT responded: ${generatedPretext}" --head "${generationBranch}" --base "main"`, { cwd: '../../project_diff' });
      await git.checkout('main');
  
      return 'wowie wow wow, this guy actually did it, he\'s the real deal';
    } else {
      return 'yo that shit bunk homie, no mods';
    }


    // const statements: Record<string, string | undefined>[] = sourceFile?.getChildrenOfKind(SyntaxKind.FunctionDeclaration).map(funct => {

    //   const functionName = funct.getName();

    //   let functionText = funct.getText();
    //   const functionVariables = funct.getDescendantsOfKind(SyntaxKind.VariableDeclaration)
    //     .reduce((m, vari, i) => {
    //       const varKey = `###VAR_${i + 1}###`;
    //       const varText = vari.getParent().getText();
    //       console.log(varKey, varText)
    //       functionText = functionText.replace(varText, varKey);
    //       return { ...m, [varKey]: varText };
    //     }, {} as Record<string, string>);

    //   const functionVariableNames = Object.keys(functionVariables);

    //   console.log({ name: funct.getName(), functionText, functionVariableNames })

    //   const returns = funct.getDescendantsOfKind(SyntaxKind.ReturnStatement);
    //   const functionTemplate = returns[returns.length - 1].getText();
    //   const templateName = `###COMPONENT_RETURN###`;
    //   functionText = functionText.replace(functionTemplate, templateName);

    //   const [functionSignature, functionBody] = functionText.split('\n')[0];

    //   functions.push()

    //   return [
    //     { concept: functionName, realization: functionText },
    //     ...Object.keys(functionVariables).map(fv => ({ concept: fv, realization: functionVariables[fv] })),
    //     { concept: templateName, realization: functionTemplate },
    //   ];
    // }).flat() || [];

    // console.log({ STAAAAAAAAAAAAAAAAAAAAAA: statements })

    // const mirrorGenerationPrompt = generatePromptHistory(IPrompts.MIRROR_EDIT, suggestedEdits.join(' '), JSON.stringify(statements));

    // console.log({ mirrorGenerationPrompt })

    // const generatedMirror = extractCodeBlock(await getChatCompletionPromptFromHistory(mirrorGenerationPrompt));

    // console.log({ generatedMirror })

    // try {
    //   const transformations = JSON.parse(generatedMirror) as Record<string, string>[];
    //   transformations.forEach(transforma => {

    //     const statement = statements.find(s => s.concept === transforma.concept)

    //     if (statement && statement.realization) {
    //       console.log({ SETTINGOLDTONEW: statement.realization, transformedText: transforma.realization })

    //       const text = sourceFile.getText();
    //       text.replace(statement.realization, transforma.realization);
    //       sourceFile.replaceWithText(text);
    //       sourceFile.saveSync();
    //     }
    //   })

    //   await project.save();
    // } catch (error) {
    //   return 'too complex for me';
    // }
  }

  return 'you\'re in for a real treat: file not found';
}

async function editFile(fileParts: string) {
  const [fileName, ...suggestedEdits] = fileParts.split(' ');

  const project = new Project({
    tsConfigFilePath: './projectts.json'
  });
  const sourceFile = project.getSourceFiles().filter(sf => sf.getFilePath().toLowerCase().includes(fileName.toLowerCase()))[0];

  if (sourceFile) {

    const morphGenerationPrompt = generatePromptHistory(IPrompts.MORPH_3, suggestedEdits.join(' '), sourceFile.getText());

    console.log({ morphGenerationPrompt });

    const generatedMorphs = extractCodeBlock(await getChatCompletionPromptFromHistory(morphGenerationPrompt));

    console.log({ generatedMorphs })

    processSuggestion(sourceFile as SourceFile, generatedMorphs);

    // applyChangeSet(JSON.parse(generatedMorphs), sourceFile as SourceFile);

    // const editGenerationPrompt = generatePromptHistory(IPrompts.EDIT_FILE, suggestedEdits.join(' '), sourceFile.getText());

    // console.log({ editGenerationPrompt });

    // const generatedEdits = extractCodeBlock(await getChatCompletionPromptFromHistory(editGenerationPrompt));

    // sourceFile.replaceWithText(generatedEdits);
    await project.save();
    return 'successfully edited a file, thanks for all the hard work';
  } else {
    return 'could not find any file you\'re talking about homegirl';
  }
}

async function createDocumentation() {

}

async function createTest() {

}

async function generateApi(typeName: string, user: string) {
  if (!isValidName(typeName)) {
    return 'tried to create an api but failed because they did not use the right format';
  }

  const typeGenerationPrompt = generatePrompt(IPrompts.CREATE_TYPE, typeName);

  console.log({ typeGenerationPrompt });

  const generatedType = await getChatCompletionPrompt(typeGenerationPrompt);
  const coreTypesPath = path.join(__dirname, `../../core/types/generated/${toSnakeCase(typeName)}.ts`);
  const creatorComment = `/* Created by Twitch chatter ${user} */\n`;
  const comment = `/*\n* @category${toTitleCase(typeName)}\n*/\n`;

  fs.appendFileSync(coreTypesPath, `${creatorComment}${comment}${generatedType}\n\n`);

  const apiGenerationPrompt = generatePromptHistory(IPrompts.CREATE_API, generatedType);

  console.log({ apiGenerationPrompt });

  const generatedApi = extractCodeBlock(await getChatCompletionPromptFromHistory(apiGenerationPrompt));

  fs.appendFileSync(coreTypesPath, `${comment}${generatedApi}\n\n`);

  const project = new Project({
    tsConfigFilePath: './projectts.json'
  });
  const sourceFile = project.addSourceFileAtPath(coreTypesPath);
  const variables = sourceFile.getVariableDeclarations();
  const apiEndpoints: string[] = [];

  for (const v of variables) {
    if (v.getName().endsWith('Api')) {
      const initializer = v.getInitializer();
      if (initializer) {
        initializer.getType().getProperties().forEach(p => {
          apiEndpoints.push(p.getName())
        });
      }
    }
  }
  console.log({ apiEndpoints });

  try {

    const apiBackendGenerationPrompt = generatePromptHistory(IPrompts.CREATE_API_BACKEND, generatedType + ' ' + apiEndpoints.join(' '));

    console.log({ apiBackendGenerationPrompt });

    const generatedApiBackend = extractCodeBlock(await getChatCompletionPromptFromHistory(apiBackendGenerationPrompt));

    sourceFile.insertText(sourceFile.getEnd(), `${comment}${generatedApiBackend}\n\n`);
    sourceFile.fixMissingImports();
    await project.save();
  } catch (error) {
    console.error(error);
  }

  return `successfully created an entire api ${typeName} all by themselves, awayto go, champ!`;
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

type ChangeType =
  | "modifyReactComponent"
  | "addImport"
  | "removeImport"
  | "addHook"
  | "removeHook"
  | "modifyHook"
  | "addVariable"
  | "modifyJsx"
  | "modifyJsxAttribute"
  | "addJsxElement"
  | "wrapJsxElement";

interface Change {
  type: ChangeType;
  payload: any;
}

type ChangeSet = Change[];

function applyChangeSet(changeSet: ChangeSet, node: SourceFile | FunctionDeclaration) {
  changeSet.forEach((change) => {
    const { type, payload } = change;
    console.log({ type, payload })
    switch (type.toLowerCase()) {
      case "modifyreactcomponent":
        const componentDeclaration = findReactComponent(node as SourceFile, payload.componentName);
        payload.changes.forEach((componentChange: Change) => applyChangeSet([componentChange], componentDeclaration as FunctionDeclaration));
        break;
      case "addimport":
        addOrUpdateImport(node as SourceFile, payload.importName, payload.importSource);
        break;
      case "removeimport":
        removeImport(node as SourceFile, payload.importName, payload.importSource);
        break;
      case "addhook":
        addHookToComponent(payload.hookDeclaration, node as FunctionDeclaration);
        break;
      case "removehook":
        removeHookFromComponent(payload.hookName, node as FunctionDeclaration);
        break;
      case "modifyhook":
        modifyHookInitializer(node as FunctionDeclaration, payload.hookName, payload.newInitializer);
        break;
      case "addvariable":
        addVariableToComponent(payload.variableDeclaration, node as FunctionDeclaration);
        break;
      case "modifyjsx":
        payload.changes.forEach((jsxChange: Change) => applyChangeSet([jsxChange], node));
        break;
      case "modifyjsxattribute":
        modifyJsxAttribute(node as SourceFile, payload.elementName, payload.attributeName, payload.newValue);
        break;
      case "addjsxelement":
        addJsxElement(node as SourceFile, payload.parentElementName, payload.newElement, payload.position, payload.siblingElementName);
        break;
      case "wrapjsxelement":
        wrapJsxElement(node as SourceFile, payload.elementName, payload.wrapper, payload.closingWrapper);
        break;
      default:
        console.error(`Unknown change type: ${type}`);
    }
  });
}

// Utilities
function findReactComponent(sourceFile: SourceFile, componentName: string) {
  return sourceFile.getFunctionOrThrow(componentName);
}

// Import handling
function addOrUpdateImport(sourceFile: SourceFile, importName: string, importSource: string) {
  const existingImport = sourceFile.getImportDeclaration(importSource);
  if (existingImport) {
    const namedImports = existingImport.getNamedImports();
    if (!namedImports.some((namedImport) => namedImport.getName() === importName)) {
      existingImport.addNamedImport(importName);
    }
  } else {
    sourceFile.addImportDeclaration({
      namedImports: [importName],
      moduleSpecifier: importSource,
    });
  }
}

function removeImport(sourceFile: SourceFile, importName: string, importSource: string) {
  const existingImport = sourceFile.getImportDeclarations().find(declaration => declaration.getModuleSpecifierValue() === importSource);
  if (existingImport) {
    const namedImports = existingImport.getNamedImports();
    const importToRemove = namedImports.find((namedImport) => namedImport.getName() === importName);

    if (importToRemove) {
      importToRemove.remove();

      // If no named imports are left, remove the entire import declaration
      if (existingImport.getNamedImports().length === 0) {
        existingImport.remove();
      }
    }
  }
}

// Hook handling
function addHookToComponent(hookDeclaration: string, componentDeclaration: FunctionDeclaration) {
  const functionBody = componentDeclaration.getBodyText();
  const newFunctionBody = `${hookDeclaration}\n${functionBody}`;
  componentDeclaration.setBodyText(newFunctionBody);
}

function removeHookFromComponent(hookName: string, componentDeclaration: FunctionDeclaration) {
  const statements = componentDeclaration.getStatements();
  const hookStatement = statements.find(statement => {
    const text = statement.getText();
    return text.trim().startsWith(hookName) || text.trim().includes(`.${hookName}`);
  });

  if (hookStatement) {
    hookStatement.remove();
  }
}

function modifyHookInitializer(componentDeclaration: FunctionDeclaration, hookName: string, newInitializer: string) {
  const hookDeclaration = componentDeclaration.getVariableDeclarationOrThrow(hookName);
  hookDeclaration.setInitializer(newInitializer);
}

// Variable handling
function addVariableToComponent(variableDeclaration: string, componentDeclaration: FunctionDeclaration) {
  const functionBody = componentDeclaration.getBodyText();
  const newFunctionBody = `${variableDeclaration}\n${functionBody}`;
  componentDeclaration.setBodyText(newFunctionBody);
}

function getJsxElementByTagName(sourceFile: SourceFile, tagName: string): JsxElement | undefined {
  const jsxElements = sourceFile.getDescendantsOfKind(SyntaxKind.JsxElement);
  return jsxElements.find(element => element.getOpeningElement().getTagNameNode().getText() === tagName);
}

function getJsxElementByTagNameOrThrow(sourceFile: SourceFile, tagName: string): JsxElement {
  const element = getJsxElementByTagName(sourceFile, tagName);
  if (!element) {
    throw new Error(`JSX element with tag name '${tagName}' not found`);
  }
  return element;
}

// JSX handling
function modifyJsxAttribute(sourceFile: SourceFile, elementName: string, attributeName: string, newValue: string) {
  const element = getJsxElementByTagNameOrThrow(sourceFile, elementName);
  const openingElement = element.getOpeningElement();
  const attribute = openingElement.getAttribute(attributeName);

  if (attribute) {
    const attributeValue = attribute.getFirstChildByKind(SyntaxKind.JsxExpression) || attribute.getFirstChildByKind(SyntaxKind.StringLiteral);
    if (attributeValue) {
      attributeValue.replaceWithText(`"${newValue}"`);
    }
  } else {
    openingElement.addAttribute({
      name: attributeName,
      initializer: `"${newValue}"`,
    });
  }
}

function addJsxElement(sourceFile: SourceFile, parentElementName: string, newElement: string, position: 'before' | 'after', siblingElementName: string) {
  const parentElement = getJsxElementByTagNameOrThrow(sourceFile, parentElementName);
  const siblingElement = parentElement.getChildSyntaxList()?.getChildrenOfKind(SyntaxKind.JsxElement).find(child => child.getOpeningElement().getTagNameNode().getText() === siblingElementName);

  if (siblingElement) {
    if (position === 'before') {
      siblingElement.getParentSyntaxList()?.insertChildText(0, newElement);
    } else {
      siblingElement.getParentSyntaxList()?.insertChildText(siblingElement.getChildCount(), newElement);
    }
  } else {
    throw new Error(`Sibling element "${siblingElementName}" not found.`);
  }
}

function wrapJsxElement(sourceFile: SourceFile, elementName: string, wrapper: string, closingWrapper: string) {
  const element = getJsxElementByTagNameOrThrow(sourceFile, elementName);
  const wrappedJsx = `${wrapper}${element.getText()}${closingWrapper}`;
  element.replaceWithText(wrappedJsx);
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