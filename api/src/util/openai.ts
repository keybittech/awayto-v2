
import { CreateChatCompletionResponseChoicesInner, OpenAIApi } from 'openai';
import { RequiredError } from 'openai/dist/base';
import { inspect } from 'util';
import logger from './logger';

import { IPrompts } from 'awayto';

const openai = new OpenAIApi();
const opts = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY as string}`
  }
};

function handleOpenAIError(error: unknown): void {
  const err = error as RequiredError;
  console.log('openai error', err.message + ' ' + err.field + ' ' + err.stack);
  logger.log('openai error', err.message);
}

const suggestionPrompt = `Generate: A list of 1-2 word suggestions delineated by |.`;
const moderationPrompt = `Moderate: The word "true" if Phrase is not appropriate for business use or <content> is flagged, "false" otherwise.`;

function generateExample(prompt: string, result: string = '') {
  return `Phrase: ${prompt}\nResult: ${result}`;
}

export function generatePrompt(promptId: IPrompts, prompt: string): string {
  let generatedPrompt = `The next sentence describes your function and result format.`;
  switch (promptId) {
    case IPrompts.SUGGEST_SERVICE:
      generatedPrompt += `
        ${suggestionPrompt}
        ${generateExample('Service names for learning center group', 'Tutoring|Advising|Consulting|Instruction|Mentoring')}
        ${generateExample('Service names for Greater North County Bank group', 'Accounting|Financing|Securities|Financial Planning|Investing')}
        ${generateExample(`Service names for ${prompt} group`)}`;
      break;
    case IPrompts.SUGGEST_TIER:
      generatedPrompt += `
        ${suggestionPrompt}
        ${generateExample('Tier names for a generic or unknown service', 'Small|Medium|Large')}
        ${generateExample('Tier names for a coffee cart service', 'Tall|Grande|Venti')}
        ${generateExample('Tier names for a streaming service', 'Basic|Standard|Premium')}
        ${generateExample('Tier names for a airline service', 'Economy|Business|First Class')}
        ${generateExample('Tier names for a writing and reading center service', 'ESL 900|ESL 990|ENG 1010|ENG 1020|ENG 2010')}
        ${generateExample(`Tier names for a ${prompt} service`)}`;
      break;
    case IPrompts.SUGGEST_FEATURE:
      generatedPrompt += `
        ${suggestionPrompt}
        ${generateExample('Writing Tutoring service at the ENG 1010 tier', 'Feedback|Revisions|Brainstorming|Discussion')}
        ${generateExample('City Gym service at the Standard tier', 'Full Gym Equipment|Limited Training|Half-Day Access')}
        ${generateExample('Web Hosting service at the Pro tier', 'Unlimited Sites|Unlimited Storage|1TB Bandwidth|Daily Backups')}
        ${generateExample(prompt)}`;
      break;
    case IPrompts.MODERATE_PHRASE:
      generatedPrompt += `
        ${moderationPrompt}
        ${generateExample('<any word classified as a swear word in any culture>', 'true')}
        ${generateExample('adult bookstore', 'false')}
        ${generateExample('a nationalist sympathizer group', 'true')}
        ${generateExample(prompt)}`;
      break;
    default:
      break;
  }

  return generatedPrompt.replace(/\r?\n|\r-/g, ' ');
}

export async function getChatCompletionPrompt(prompt: string): Promise<CreateChatCompletionResponseChoicesInner[]> {
  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: "user", content: prompt }
      ]
    }, opts);

    console.log(inspect({ prompt, result: inspect(completion.data.choices) }))

    return completion.data.choices || [];
  } catch (error) {
    handleOpenAIError(error);
  }
  return [];
}
