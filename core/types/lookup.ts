import { Merge } from '../util'
import { ITimeUnit } from '.';

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
