import { ITimeUnit, PayloadAction } from '.';
import { Merge } from '../util'

declare global {
  interface IMergedState extends Merge<ILookupState> {}
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
export type ILookupState = ILookup & {
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