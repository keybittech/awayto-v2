
import { CreateChatCompletionResponseChoicesInner, CreateCompletionResponseChoicesInner, CreateModerationResponseResultsInner, OpenAIApi } from 'openai';
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
  return `Generate 5 ${prompt}; Result is 1-3 words separated by |. Here are some examples: `;
}

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
    case IPrompts.SUGGEST_ROLE:
      generatedPrompt += `
        ${getSuggestionPrompt(`role names for a group named ${prompt} which is interested in ${prompt2}`)}
        ${generateExample('role names for a group named writing center which is interested in consulting on writing', 'Tutor|Student|Advisor|Administrator|Consultant')}
        ${generateExample('role names for a group named city maintenance department which is interested in maintaining the facilities in the city', 'Dispatcher|Engineer|Administrator|Technician|Manager')}
        ${generateExample(`role names for a group named "${prompt}" which is interested in ${prompt2}`)}
      `;
      break;
    case IPrompts.SUGGEST_SERVICE:
      generatedPrompt += `
        ${getSuggestionPrompt(`gerund verbs performed for the purpose of ${prompt}`)}
        ${generateExample('gerund verbs performed for the purpose of offering educational services to community college students', 'Tutoring|Advising|Consulting|Instruction|Mentoring')}
        ${generateExample('gerund verbs performed for the purpose of providing banking services to the local area', 'Accounting|Financing|Securities|Financial Planning|Investing')}
        ${generateExample(`gerund verbs performed for the purpose of ${prompt}`)}`;
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
        ${generateExample('features of ENGL 1010 writing tutoring', 'Feedback|Revisions|Brainstorming|Discussion')}
        ${generateExample('features of Standard gym membership', 'Full Gym Equipment|Limited Training|Half-Day Access')}
        ${generateExample('features of Pro web hosting service', 'Unlimited Sites|Unlimited Storage|1TB Bandwidth|Daily Backups')}
        ${generateExample('features of professional photography service', 'Next-Day Prints|High-quality digital photos|Retouching and editing|Choice of location|Choice of outfit changes')}
        ${generateExample(`features of ${prompt}`)}`;
      break;
    default:
      break;
  }

  return generatedPrompt.replace(/\r?\n|\r-/g, ' ').trim();
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

    for (const choice of completion.data.choices) {
      console.log({ content: choice.message?.content, formatted: choice.message?.content.trim().replace(/\r?\n|\r/g, '') });
    }

    return completion.data.choices || [];
  } catch (error) {
    handleOpenAIError(error);
  }
  return [];
}

export async function getCompletionPrompt(prompt: string): Promise<CreateCompletionResponseChoicesInner[]> {
  try {
    const completion = await openai.createCompletion({
      model: 'ada',
      prompt,
      max_tokens: 512
    }, opts);

    console.log(inspect({ prompt, result: inspect(completion.data.choices) }))

    for (const choice of completion.data.choices) {
      console.log({ content: choice.text, formatted: choice.text?.trim().replace(/\r?\n|\r/g, '') });
    }

    return completion.data.choices || [];
  } catch (error) {
    handleOpenAIError(error);
  }
  return [];
}

export async function getModerationCompletion(prompt: string): Promise<CreateModerationResponseResultsInner[]> {
  try {
    const completion = await openai.createModeration({
      input: prompt
    }, opts);

    console.log(inspect({ prompt, result: inspect(completion.data.results) }))

    return completion.data.results || [];
  } catch (error) {
    handleOpenAIError(error);
  }
  return [];
}