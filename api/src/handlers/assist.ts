import { IPrompts } from '@keybittech/wizapp/dist/lib';
import type { ApiHandlers } from 'awayto/core';

/**
 * @category Assist
 */
export default {
  getPrompt: async props => {
    const { id, prompt } = props.event.queryParameters;
    console.log({ AssistHandlerInfo: id, prompt })
    const promptResult = (await props.ai.useAi<string>(id as IPrompts, ...prompt.split('|'))).message;
    return { promptResult: promptResult.split('|').filter(a => !!a).map(a => a.trim()) };
  },
} as Pick<ApiHandlers, 'getPrompt'>;