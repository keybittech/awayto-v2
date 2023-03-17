import { ApiModule } from '../api';
import { IAssistActionTypes, IPrompts } from 'awayto';
import { generatePrompt, getChatCompletionPrompt } from '../util/openai';

const forms: ApiModule = [

  {
    action: IAssistActionTypes.GET_PROMPT,
    cache: null,
    cmnd: async (props) => {
      try {
        const { id, prompt, prompt2 } = props.event.queryParameters;

        const generatedPrompt = generatePrompt(id as IPrompts, prompt, prompt2);

        if (generatedPrompt.length) {

          const promptResult = await getChatCompletionPrompt(generatedPrompt);

          return { promptResult: promptResult[0].message?.content.trim().replace(/\r?\n|\r/g, '').split('|').filter(a => !!a) };
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