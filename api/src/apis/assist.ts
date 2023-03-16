import { ApiModule } from '../api';
import { IAssistActionTypes, IPrompts } from 'awayto';
import { OpenAIApi } from 'openai';

const openai = new OpenAIApi();

const suggestionPrompt = `A list of 1-2 word suggestions delineated by |.`;

function generateExample(prompt: string, result: string = '') {
  return `Phrase: ${prompt}\nResult: ${result}`;
}

function generatePrompt(promptId: IPrompts, prompt: string): string {
  let generatedPrompt = ``;
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
    default:
      break;
  }

  return generatedPrompt.replace(/\r?\n|\r-/g, "");
}

const forms: ApiModule = [

  {
    action: IAssistActionTypes.GET_PROMPT,
    cache: 86400,
    cmnd: async (props) => {
      try {
        const { id, prompt } = props.event.queryParameters;

        const generatedPrompt = generatePrompt(id as IPrompts, prompt);


        if (generatedPrompt.length) {
          
          const completion = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages: [{
              role: "user",
              content: generatedPrompt
            }]
          }, {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY as string}`
            }
          });

          const promptResult = completion.data.choices[0].message?.content.trim().split('|').filter(a => !!a) || [];

          return { promptResult };
        } else {
          return false;
        }

      } catch (error) {
        throw error;
      }
    }
  }

];

export default forms;