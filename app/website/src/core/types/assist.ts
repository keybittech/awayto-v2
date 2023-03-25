import { PayloadAction } from '.';
import { Merge } from '../util';

declare global {
  interface IMergedState extends Merge<IAssistState> {}
}

export enum IPrompts {
  SUGGEST_ROLE = 'suggest_role',
  SUGGEST_SERVICE = 'suggest_service',
  SUGGEST_TIER = 'suggest_tier',
  SUGGEST_FEATURE = 'suggest_feature',
  CONVERT_PURPOSE = 'convert_purpose'
}


/**
 * @category Awayto
 */
export type IAssist = {
  prompt: string;
  prompt2: string;
  promptResult: string[];
};

/**
 * @category Assist
 */
export type IAssistState = IAssist & {
  assists: Record<string, IAssist>
};

/**
 * @category Action Types
 */
export enum IAssistActionTypes {
  GET_PROMPT = "GET/assist/prompt"
}

/**
 * @category Assist
 */
export type IPostAssistsAction = PayloadAction<IAssistActionTypes.GET_PROMPT, IAssist>;

/**
 * @category Assist
 */
export type IAssistActions = IPostAssistsAction;