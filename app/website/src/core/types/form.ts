import { PayloadAction } from '.';
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
export type IField = Record<string, string | boolean> & {
  i?: string; // id
  l: string; // label
  v?: string; // value
  h?: string; // helperText
  t?: string; // type
  d?: string; // defaultValue
  r?: boolean; // required
};

/**
 * @category Form
 */
export type IFormTemplate = Record<string, IField[]>;

export type IFormSubmission = Record<string, string[]>;

/**
 * @category Form
 */
export type IFormVersionSubmission = {
  id?: string;
  formVersionId: string;
  submission: IFormSubmission;
}

/**
 * @category Form
 */
export type IFormVersion = {
  id: string;
  formId: string;
  form: IFormTemplate;
  submission: IFormSubmission;
  createdOn: string;
  createdSub: string;
}

/**
 * @category Form
 */
export type IForm = {
  id: string;
  name: string;
  version: IFormVersion;
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
  POST_FORM_VERSION = "POST/forms/:formId",
  PUT_FORM = "PUT/forms",
  GET_FORMS = "GET/forms",
  GET_FORM_BY_ID = "GET/forms/:formId",
  DELETE_FORM = "DELETE/forms/:formId",
  DISABLE_FORM = "PUT/forms/:formId/disable"
}

/**
 * @category Form
 */
export type IPostFormAction = PayloadAction<IFormActionTypes.POST_FORM, IForm[]>;

/**
 * @category Form
 */
export type IPostFormVersionAction = PayloadAction<IFormActionTypes.POST_FORM_VERSION, IForm[]>;

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
  | IPostFormVersionAction
  | IPutFormAction
  | IGetFormsAction
  | IGetFormByIdAction
  | IDeleteFormAction
  | IDisableFormAction;