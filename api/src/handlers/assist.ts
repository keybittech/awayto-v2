import { createHandlers } from 'awayto/core';

/**
 * @category Assist
 */
export default createHandlers({
  getPrompt: async props => {
    if (!process.env.OPENAI_API_KEY) return { promptResult: [] };
    
    const { id, prompt } = props.event.queryParameters;
    const promptResult = (await props.ai.useAi<string>(id, ...prompt.split('|'))).message;
    return { promptResult: promptResult.split('|').filter(a => !!a).map(a => a.trim()) };
  },
});