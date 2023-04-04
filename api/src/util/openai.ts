
import { OpenAIApi } from 'openai';
import logger from './logger';

import { IPrompts } from 'awayto/core';

const openai = new OpenAIApi();
const opts = {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.OPENAI_API_KEY as string}`
  }
};

function handleOpenAIError(error: unknown): void {
  const err = error as Error & { field: string };
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
        Complete the following statement: A 50 character maximum passive gerund mission statement for a business named "${prompt}" with the description of "${prompt2}", could be 
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
        ${generateExample('service level names for writing tutoring at a school writing center', 'WRI 1010|WRI 1020|WRI 2010|WRI 2020|WRI 3010')}
        ${generateExample('service level names for streaming at a web media platform', 'Basic|Standard|Premium')}
        ${generateExample('service level names for advising at a school learning center', 'ENG 1010|WRI 1010|MAT 1010|SCI 1010|HIS 1010')}
        ${generateExample('service level names for travelling on an airline service', 'Economy|Business|First Class')}
        ${generateExample('service level names for reading tutoring at a school reading center', 'ESL 900|ESL 990|ENG 1010|ENG 1020|ENG 2010')}
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

export async function getChatCompletionPrompt(input: string): Promise<string> {
  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: "user", content: input }
      ],
      max_tokens: 512
    }, opts);

    const result = completion.data.choices.at(0)?.message?.content.trim().replace(/\r?\n|\r/g, '') || '';
    const prompt = input.split(';')[0];

    logger.log('openai chat completion prompt', { prompt, result });
    console.log('openai chat completion prompt', { prompt, result });

    return result;
  } catch (error) {
    handleOpenAIError(error);
    throw { reason: 'Could not complete prompt.' }
  }
}

export async function getCompletionPrompt(input: string): Promise<string> {
  try {
    const completion = await openai.createCompletion({
      model: 'ada',
      prompt: input,
      max_tokens: 512
    }, opts);

    const result = completion.data.choices.at(0)?.text?.trim().replace(/\r?\n|\r/g, '') || ''
    const prompt = input.split(';')[0];

    logger.log('openai completion prompt', { prompt, result });
    console.log('openai completion prompt', { prompt, result });

    return result;
  } catch (error) {
    handleOpenAIError(error);
    throw { reason: 'Could not complete prompt.' }
  }
}

export async function getModerationCompletion(input: string): Promise<boolean | undefined> {
  try {
    const completion = await openai.createModeration({
      input
    }, opts);

    const result = completion.data.results.at(0)?.flagged;
    const prompt = input.split(';')[0];

    logger.log('openai moderation', { prompt, result });
    console.log('openai moderation', { prompt, result });

    return result;
  } catch (error) {
    handleOpenAIError(error);
    throw { reason: 'Could not complete prompt.' }
  }
}