import { IWebhooks } from 'awayto/core';

export const AssistWebhooks: IWebhooks = { 
  CHANNEL_POINT_REDEMPTION: async (props) => {
    // const {  } = props.event.body;

    // console.log('assist event', props.event)
    
    // const completion = await openai.createCompletion({
    //   model: 'text-davinci-003',
    //   prompt: generatePrompt(''),
    //   temperature: 0.6,
    //   max_tokens: 20
    // },{
    //   headers: {
    //     'Authorization': `Bearer ${process.env.OPENAI_API_KEY as string}`
    //   }
    // });
    
    
    // console.log(JSON.stringify(completion.data))
    
  },
  AUTH_LOGIN: async event => {
  },
  AUTH_LOGOUT: async event => {
  }
}