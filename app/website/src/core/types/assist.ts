import { ITimeUnit, PayloadAction } from '.';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    assist: IAssistState
  }

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
  message: string;
};

/**
 * @category Assist
 */
export type IAssistState = IAssist;

/**
 * @category Action Types
 */
export enum IAssistActionTypes {
  POST_ASSIST = "POST/assist"
}

/**
 * @category Assist
 */
export type IPostAssistsAction = PayloadAction<IAssistActionTypes.POST_ASSIST, IAssist>;

/**
 * @category Assist
 */
export type IAssistActions = IPostAssistsAction;