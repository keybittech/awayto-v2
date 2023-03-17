
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

function getSuggestionPrompt(prompt: string) {
  return `Generate 5 ${prompt}, in a | delineated list. Here are some examples: `;
}

const moderationPrompt = `Return the word "true" if Phrase is not appropriate for business use or <content> is flagged, "false" otherwise.`;

function generateExample(prompt: string, result: string = '') {
  return `Phrase: ${prompt}\nResult: ${result}`;
}

export function generatePrompt(promptId: IPrompts, prompt: string, prompt2?: string): string {
  let generatedPrompt = ``;
  switch (promptId) {
    case IPrompts.CONVERT_PURPOSE:
      generatedPrompt += `
        Complete the following: A 50 character maximum gerund mission statement for a business, named "${prompt}", with the description of "${prompt2}", could be 
      `;
      break;
    case IPrompts.SUGGEST_SERVICE:
      generatedPrompt += `
        ${getSuggestionPrompt(`gerund verbs performed for the purpose of "${prompt}"`)}
        ${generateExample('gerund verbs performed for the purpose of offering educational services to community college students', 'Tutoring|Advising|Consulting|Instruction|Mentoring')}
        ${generateExample('gerund verbs performed for the purpose of providing banking services to the local area', 'Accounting|Financing|Securities|Financial Planning|Investing')}
        ${generateExample(`gerund verbs performed for the purpose of "${prompt}"`)}`;
      break;
    case IPrompts.SUGGEST_TIER:
      generatedPrompt += `
        ${getSuggestionPrompt(`service level names for ${prompt}`)}
        ${generateExample('service level names for a generic service', 'Small|Medium|Large')}
        ${generateExample('service level names for a writing center', 'WRI 1010|WRI 1020|WRI 2010|WRI 2020|WRI 3010')}
        ${generateExample('service level names for a streaming service', 'Basic|Standard|Premium')}
        ${generateExample('service level names for an educational learning center', 'ENG 1010|WRI 1010|MAT 1010|SCI 1010|HIS 1010')}
        ${generateExample('service level names for a airline service', 'Economy|Business|First Class')}
        ${generateExample('service level names for a reading center', 'ESL 900|ESL 990|ENG 1010|ENG 1020|ENG 2010')}
        ${generateExample(`service level names for ${prompt}`)}`;
      break;
    case IPrompts.SUGGEST_FEATURE:
      generatedPrompt += `
        ${getSuggestionPrompt(`features of ${prompt}`)}
        ${generateExample('features of ENGL 1010 writing tutoring at community college', 'Feedback|Revisions|Brainstorming|Discussion')}
        ${generateExample('features of Standard membership at city gym', 'Full Gym Equipment|Limited Training|Half-Day Access')}
        ${generateExample('features of Pro web hosting service at digital grounds pc shop', 'Unlimited Sites|Unlimited Storage|1TB Bandwidth|Daily Backups')}
        ${generateExample(`features of ${prompt}`)}`;
      break;
    case IPrompts.MODERATE_PHRASE:
      generatedPrompt += `
        ${moderationPrompt}
        ${generateExample('<any word classified as a swear word in any culture>', 'true')}
        ${generateExample('adult bookstore', 'false')}
        ${generateExample('a political extremist group', 'true')}
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
      ],
      max_tokens: 512
    }, opts);

    console.log(inspect({ prompt, result: inspect(completion.data.choices) }))

    return completion.data.choices || [];
  } catch (error) {
    handleOpenAIError(error);
  }
  return [];
}
