import { PayloadAction } from '.';
import { Merge } from '../util';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    assist: IAssistState
  }

  interface IMergedState extends Merge<unknown, IAssistState> {}

  /**
   * @category Awayto Redux
   */
  type IAssistModuleActions = IAssistActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    assist: IAssistActionTypes;
  }
}

/**
 * @category Awayto
 */
export type IAssist = {
  prompt: string;
  result: string;
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
  GET_SUGGESTION = "GET/assist/suggest"
}

/**
 * @category Assist
 */
export type IPostAssistsAction = PayloadAction<IAssistActionTypes.GET_SUGGESTION, IAssist>;

/**
 * @category Assist
 */
export type IAssistActions = IPostAssistsAction;