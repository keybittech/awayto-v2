import { PayloadAction } from '.';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    forms: IFormState
  }

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
  id?: string;
  name: string;
}

/**
 * @category Awayto
 */
export type IForm = {
  budgets: ILookup[];
  timelines: ILookup[];
  scheduleContexts: ILookup[];
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