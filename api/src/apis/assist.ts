import { ApiModule } from '../api';
import { IAssistActionTypes } from 'awayto';
import { OpenAIApi } from 'openai';

const openai = new OpenAIApi();

function generatePrompt(id: IAssistActionTypes, prompt: string): string {
  switch (id) {
    case IAssistActionTypes.GET_SUGGESTION:
      return `
        Given a topical phrase, return 5 suggestions. Prefer present participle verbs instead of nouns, when applicable. Responses should trend toward educational and business use cases. Respond only to the completion request, and only with the 5 word or phrase suggestions in a list delineated by a | symbol.

        Example
        Phrase: Roles names of writing center users
        Result: Tutor|Student|Advisor|Consultant|Tutee
        
        Example
        Phrase: Features of a gardening service
        Result: Lawncare|Hedge Trimming|Stump Grinding|Bouquet Design|Landscaping
        
        Completion
        Phrase: ${prompt}
        Result: 
      `;
    default:
      return '';
  }
}

const forms: ApiModule = [

  {
    action: IAssistActionTypes.GET_SUGGESTION,
    cmnd : async (props) => {
      try {
        const { prompt } = props.event.queryParameters;

        const generatedPrompt = generatePrompt(IAssistActionTypes.GET_SUGGESTION, prompt);
  

        if (generatedPrompt.length) {

          const completion = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt: generatedPrompt,
            temperature: 0.6,
            max_tokens: 256
          },{
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY as string}`
            }
          });

          let result = '';
          
          for (const data of completion.data.choices) {
            result += data.text?.trim().split('|').join(', ') || '';
          }

          return { result }; 
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