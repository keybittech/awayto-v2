import { ApiOptions, EndpointType } from './api';
import { IPrompts } from '@keybittech/wizapp/dist/lib';

declare module '@keybittech/wizapp/dist/lib' {
  export enum IPrompts {
    TRANSLATE = 'translate'
  }
}

export const ChatPrompts = Object.assign(IPrompts, { TRANSLATE: 'translate' });

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
export default {
  getPrompt: {
    kind: EndpointType.QUERY,
    url: 'assist/prompt?id=:id&prompt=:prompt',
    method: 'GET',
    opts: {
      cache: null,
      load: true
    } as ApiOptions,
    queryArg: {
      id: '' as string,
      prompt: '' as string
    },
    resultType: { promptResult: [] as string[] }
  },
} as const;
