import { ApiModule } from '../api';
import { IAssistActionTypes, IPrompts } from 'awayto';
import { generatePrompt, getChatCompletionPrompt, getCompletionPrompt } from '../util/openai';
import { rateLimitResource } from '../util/redis';

const forms: ApiModule = [

  {
    action: IAssistActionTypes.GET_PROMPT,
    cache: null,
    cmnd: async (props) => {
      try {

        // if (await rateLimitResource(props.event.userSub, 'assist', 10, 'day')) {
        //   throw { reason: 'Suggestions are limited to 10 per day.' };
        // }

        const { id, prompt, prompt2 } = props.event.queryParameters;

        const generatedPrompt = generatePrompt(id as IPrompts, prompt, prompt2);

        if (generatedPrompt.length) {

          const promptResult = await getChatCompletionPrompt(generatedPrompt);

          // return { promptResult: promptResult[0].text?.trim().replace(/\r?\n|\r/g, '').split('|').filter(a => !!a) };
          return { promptResult: promptResult.split('|').filter(a => !!a) };
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