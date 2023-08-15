import { createHandlers } from 'awayto/core';
import { rateLimitResource } from '../modules/redis';

/**
 * @category Assist
 */
export default createHandlers({
  getPrompt: async props => {
    if (!process.env.OPENAI_API_KEY) return { promptResult: [] };

    if (await rateLimitResource(props.event.userSub, 'prompt', 3, 8600)) { // limit n general api requests per second
      return { promptResult: [] };
    }

    const { id, prompt } = props.event.queryParameters;
    const promptResult = (await props.ai.useAi<string>(id, ...prompt.split('%7C'))).message;
    return { promptResult: promptResult.split('|').filter(a => !!a).map(a => a.trim()) };
  },
});