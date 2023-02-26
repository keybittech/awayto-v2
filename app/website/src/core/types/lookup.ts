import { ITimeUnit, PayloadAction } from '.';
import { Merge } from '../util'

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    lookup: ILookupState
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
    lookup: ILookupActionTypes;
  }
}

/**
 * @category Lookup
 */
export type ILookup = {
  id: string;
  name: string;
}

/**
 * @category Lookup
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
 * @category Lookup
 */
export type IGetLookupsAction = PayloadAction<ILookupActionTypes.GET_LOOKUPS, ILookup>;

/**
 * @category Lookup
 */
export type ILookupActions = IGetLookupsAction;