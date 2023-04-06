import { Extend } from '../util';
import { ApiHandler, ApiOptions, EndpointType, siteApiHandlerRef, siteApiRef } from './api';

/**
 * @category Assist
 */
export enum IPrompts {
  SUGGEST_ROLE = 'suggest_role',
  SUGGEST_SERVICE = 'suggest_service',
  SUGGEST_TIER = 'suggest_tier',
  SUGGEST_FEATURE = 'suggest_feature',
  CONVERT_PURPOSE = 'convert_purpose'
}

/**
 * @category Assist
 */
export type IAssist = {
  prompt: string;
  prompt2: string;
  promptResult: string[];
};

/**
 * @category Assist
 */
const assistApi = {
  getPrompt: {
    kind: EndpointType.QUERY,
    url: 'assist/prompt',
    method: 'GET',
    opts: { cache: null } as ApiOptions,
    queryArg: {
      id: '' as string,
      prompt: '' as string,
      prompt2: '' as string
    },
    resultType: { promptResult: [] as string[] }
  },
} as const;

/**
 * @category Assist
 */
const assistApiHandlers: ApiHandler<typeof assistApi> = {
  getPrompt: async props => {
    const { id, prompt, prompt2 } = props.event.queryParameters;
    const generatedPrompt = props.completions.generatePrompt(id as IPrompts, prompt, prompt2);
    const promptResult = await props.completions.getChatCompletionPrompt(generatedPrompt);
    // return { promptResult: promptResult[0].text?.trim().replace(/\r?\n|\r/g, '').split('|').filter(a => !!a) };
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
