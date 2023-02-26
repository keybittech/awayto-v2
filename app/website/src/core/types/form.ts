import { ITimeUnit, PayloadAction } from '.';
import { Merge } from '../util'

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    form: IFormState
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
    form: IFormActionTypes;
  }
}


/**
 * @category Form
 */
export type IField = {
  id: string;
  name: string;
  value: string;
  helperText: string;
  type: string;
  defaultValue: string;
  required: boolean;
};

/**
 * @category Form
 */
export type IFormTemplate = {
  fields: Record<string, IField>;
};

/**
 * @category Form
 */
export type IFormVersionSubmission = {
  id: string;
  formVersionId: string;
  submission: IFormTemplate;
}

/**
 * @category Form
 */
export type IFormVersion = {
  id: string;
  formId: string;
  form: IFormTemplate;
  createdOn: string;
  createdSub: string;
}

/**
 * @category Form
 */
export type IForm = {
  id: string;
  name: string;
  versions: IFormVersion[];
  createdOn: string;
  createdSub: string;
}

/**
 * @category Form
 */
export type IFormState = Partial<IForm> & {
  forms: Record<string, IForm>
};

/**
 * @category Action Types
 */
export enum IFormActionTypes {
  POST_FORM = "POST/forms",
  PUT_FORM = "PUT/forms",
  GET_FORMS = "GET/forms",
  GET_FORM_BY_ID = "GET/forms/:id",
  DELETE_FORM = "DELETE/forms/:id",
  DISABLE_FORM = "PUT/forms/:id/disable"
}

/**
 * @category Form
 */
export type IPostFormAction = PayloadAction<IFormActionTypes.POST_FORM, IForm[]>;

/**
 * @category Form
 */
export type IPutFormAction = PayloadAction<IFormActionTypes.PUT_FORM, IForm[]>;

/**
 * @category Form
 */
export type IGetFormsAction = PayloadAction<IFormActionTypes.GET_FORMS, IForm[]>;

/**
 * @category Form
 */
export type IGetFormByIdAction = PayloadAction<IFormActionTypes.GET_FORM_BY_ID, IForm[]>;

/**
 * @category Form
 */
export type IDeleteFormAction = PayloadAction<IFormActionTypes.DELETE_FORM, IForm[]>;

/**
 * @category Form
 */
export type IDisableFormAction = PayloadAction<IFormActionTypes.DISABLE_FORM, IForm[]>;

/**
 * @category Form
 */
export type IFormActions = IPostFormAction
  | IPutFormAction
  | IGetFormsAction
  | IGetFormByIdAction
  | IDeleteFormAction
  | IDisableFormAction;