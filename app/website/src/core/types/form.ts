import { ITimeUnit, PayloadAction } from '.';
import { Merge } from '../util';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    forms: IFormState
  }

  interface IMergedState extends Merge<unknown, IFormState> {}

  /**
   * @category Awayto Redux
   */
  type IFormModuleActions = IFormActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    forms: IFormActionTypes;
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
 * @category Awayto
 */
export type IForm = {
  budgets: ILookup[];
  timelines: ILookup[];
  timeUnits: ITimeUnit[];
};

/**
 * @category Form
 */
export type IFormState = IForm;

/**
 * @category Action Types
 */
export enum IFormActionTypes {
  GET_FORMS = "GET/forms"
}

/**
 * @category Form
 */
export type IGetFormsAction = PayloadAction<IFormActionTypes.GET_FORMS, IForm>;

/**
 * @category Form
 */
export type IFormActions = IGetFormsAction;