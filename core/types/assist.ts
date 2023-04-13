import { Extend } from '../util';
import { ApiHandler, ApiOptions, EndpointType, siteApiHandlerRef, siteApiRef } from './api';

/**
 * @category Assist
 */
export enum IPrompts {
  CREATE_API = 'create_api',
  CREATE_API_BACKEND = 'create_api_backend',
  CREATE_TYPE = 'create_type',
  CREATE_GEN_COMPONENT = 'create_gen_component',
  CREATE_APP_COMPONENT = 'create_app_component',
  EDIT_FILE = 'edit_file',
  MORPH_FILE = 'morph_file',
  MORPH_2 = 'morph_2',
  MORPH_3 = 'morph_3',
  GUIDED_EDIT = 'guided_edit',
  MIRROR_EDIT = 'mirror_edit',
  SUGGEST_ROLE = 'suggest_role',
  SUGGEST_SERVICE = 'suggest_service',
  SUGGEST_TIER = 'suggest_tier',
  SUGGEST_FEATURE = 'suggest_feature',
  CONVERT_PURPOSE = 'convert_purpose'
}

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
    const generatedPrompt = props.completions.generatePrompt(id as IPrompts, ...prompt.split('|'));
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
