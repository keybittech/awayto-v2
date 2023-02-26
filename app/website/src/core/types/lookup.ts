import { ITimeUnit, PayloadAction } from '.';
import { Merge } from '../util'

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    lookups: ILookupState
  }

  interface IMergedState extends Merge<unknown, ILookupState> {}

  /**
   * @category Awayto Redux
   */
  type ILookupModuleActions = ILookupActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    lookups: ILookupActionTypes;
  }
}

/**
 * @category Form
 */
export type ILookup = {
  id: string;
  name: string;
}

/**
 * @category Form
 */
export type ILookupState = Partial<ILookup> & {
  budgets: ILookup[];
  timelines: ILookup[];
  timeUnits: ITimeUnit[];
};

/**
 * @category Action Types
 */
export enum ILookupActionTypes {
  GET_LOOKUPS = "GET/lookups"
}

/**
 * @category Form
 */
export type IGetFormsAction = PayloadAction<ILookupActionTypes.GET_LOOKUPS, ILookup>;

/**
 * @category Form
 */
export type ILookupActions = IGetFormsAction;