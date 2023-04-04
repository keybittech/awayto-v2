import { Merge } from '../util'

declare global {
  interface IMergedState extends Merge<IFormState> {}
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

/**
 * @category Form
 */
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
export type IFormState = IForm & {
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