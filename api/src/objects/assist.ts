import { ApiModule } from '../util/db';
import { Configuration, OpenAIApi } from 'openai';
import { ApiErrorResponse } from 'awayto';

const openai = new OpenAIApi();

function generatePrompt(input: string) {
  const prompt = `${input}`;

  return prompt;
}

const assist: ApiModule = [

  {
    method: 'POST',
    path: 'assist',
    cmnd: async (props) => {
      try {

        const { message } = props.event.body as { message: string };

        // const completion = await openai.createCompletion({
        //   model: 
        // },{
        //   headers: {
        //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY as string}`
        //   }
        // });

        
        // console.log(JSON.stringify(completion.data))
        
        return true;

      } catch (error) {
        const { message } = error as ApiErrorResponse;
        throw { message: 'oai error: ' + message };
      }

    }
  },

]

export default assist;