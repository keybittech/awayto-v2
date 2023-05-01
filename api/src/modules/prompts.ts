import { IPrompts, injectPrompts } from '@keybittech/wizapp/dist/lib';
import { injectResponseValidators } from '@keybittech/wizapp/dist/server'

declare module '@keybittech/wizapp/dist/lib' {
  export enum IPrompts {
    // new prompts here
    // NEW_PROMPT = 'new_prompt'
  }
}

const customSuggestion = 'You generate 3 to 5 suggestions following a common format. Some examples: Kite Ball|Library Card|Carrot Cake|Pogs|Dog; Red|Green|Blue|Yellow|Orange; First Place|Second Chance|Third Rock|Fourth Meal|Fifth of Vodka. You ensure all lists are basic, without numbering, etc; just words and pipe symbols.';

injectPrompts({
  [IPrompts.SUGGEST_ROLE]: [
    {
      role: 'system',
      content: customSuggestion
    },
    { role: 'user', content: 'role names for a group named writing center which is interested in consulting on writing' },
    { role: 'assistant', content: 'Tutor|Student|Advisor|Administrator|Consultant' },
    { role: 'user', content: 'role names for a group named city maintenance department which is interested in maintaining the facilities in the city' },
    { role: 'assistant', content: 'Dispatcher|Engineer|Administrator|Technician|Manager' },
    { role: 'user', content: 'role names for a group named ${prompt1} which is interested in ${prompt2}' }
  ],
  [IPrompts.SUGGEST_SERVICE]: [
    {
      role: 'system',
      content: customSuggestion
    },
    { role: 'user', content: 'gerund verbs performed for the purpose of offering educational services to community college students' },
    { role: 'assistant', content: 'Tutoring|Advising|Consulting|Instruction|Mentoring' },
    { role: 'user', content: 'gerund verbs performed for the purpose of providing banking services to the local area' },
    { role: 'assistant', content: 'Accounting|Financing|Securities|Financial Planning|Investing' },
    { role: 'user', content: 'gerund verbs performed for the purpose of ${prompt1}' }
  ],
  [IPrompts.SUGGEST_TIER]: [
    {
      role: 'system',
      content: customSuggestion
    },
    { role: 'user', content: 'service level names for a generic service' },
    { role: 'assistant', content: 'Small|Medium|Large' },
    { role: 'user', content: 'service level names for writing tutoring at a school writing center' },
    { role: 'assistant', content: 'WRI 1010|WRI 1020|WRI 2010|WRI 2020|WRI 3010' },
    { role: 'user', content: 'service level names for streaming at a web media platform' },
    { role: 'assistant', content: 'Basic|Standard|Premium' },
    { role: 'user', content: 'service level names for advising at a school learning center' },
    { role: 'assistant', content: 'ENG 1010|WRI 1010|MAT 1010|SCI 1010|HIS 1010' },
    { role: 'user', content: 'service level names for travelling on an airline service' },
    { role: 'assistant', content: 'Economy|Business|First Class' },
    { role: 'user', content: 'service level names for reading tutoring at a school reading center' },
    { role: 'assistant', content: 'ESL 900|ESL 990|ENG 1010|ENG 1020|ENG 2010' },
    { role: 'user', content: 'service level names for ${prompt1}'}
  ],
  [IPrompts.SUGGEST_FEATURE]: [
    {
      role: 'system',
      content: customSuggestion
    },
    { role: 'user', content: 'features of ENGL 1010 writing tutoring' },
    { role: 'assistant', content: 'Feedback|Revisions|Brainstorming|Discussion|Ideation' },
    { role: 'user', content: 'features of Standard gym membership' },
    { role: 'assistant', content: 'Full Gym Equipment|Limited Training|Half-Day Access' },
    { role: 'user', content: 'features of Pro web hosting service' },
    { role: 'assistant', content: 'Unlimited Sites|Unlimited Storage|1TB Bandwidth|Daily Backups' },
    { role: 'user', content: 'features of professional photography service' },
    { role: 'assistant', content: 'Next-Day Prints|High-quality digital photos|Retouching and editing|Choice of location|Choice of outfit changes' },
    { role: 'user', content: 'features of ${prompt1}'}
  ]
});

injectResponseValidators([
  obj => 'string' === typeof obj && obj.indexOf('|') > -1
]);