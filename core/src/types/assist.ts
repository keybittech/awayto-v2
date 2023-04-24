import { IPrompts } from '@keybittech/wizapp/dist/lib';
import { Extend } from '../util';
import { ApiHandler, ApiOptions, EndpointType, siteApiHandlerRef, siteApiRef } from './api';

/**
 * @category Assist
 * @purpose facilitates AI prompt and suggestion generation for form fields and other UI elements
 */
export type IAssist = {
  id: string;
  prompt: string;
  promptResult: string[];
};

/**
 * @category Assist
 */
const assistApi = {
  getPrompt: {
    kind: EndpointType.QUERY,
    url: 'assist/prompt?id=:id&prompt=:prompt',
    method: 'GET',
    opts: { cache: null } as ApiOptions,
    queryArg: {
      id: '' as string,
      prompt: '' as string
    },
    resultType: { promptResult: [] as string[] }
  },
} as const;

/**
 * @category Assist
 */
const assistApiHandlers: ApiHandler<typeof assistApi> = {
  getPrompt: async props => {
    const { id, prompt } = props.event.queryParameters;
    const promptResult = (await props.ai.useAi<string>(id as IPrompts, ...prompt.split('|'))).message;
    return { promptResult: promptResult.split('|').filter(a => !!a) };
  },
} as const;

/**
 * @category Assist
 */
type AssistApi = typeof assistApi;

/**
 * @category Assist
 */
type AssistApiHandler = typeof assistApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<AssistApi> { }
  interface SiteApiHandlerRef extends Extend<AssistApiHandler> { }
}

Object.assign(siteApiRef, assistApi);
Object.assign(siteApiHandlerRef, assistApiHandlers);
