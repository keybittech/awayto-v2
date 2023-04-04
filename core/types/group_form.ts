
import { Merge } from '../util';
import { IForm } from './form';

declare global {
  interface IMergedState extends Merge<IGroupFormState> { }
}

/**
 * @category Group Form
 */
export type IGroupForm = IForm & {
  id: string;
  groupId: string;
  formId: string;
};

/**
 * @category Group Form
 */
export type IGroupForms = Record<string, IGroupForm>;

/**
 * @category Group Form
 */
export type IGroupFormState = IGroupForm & {
  groupForms: Record<string, IGroupForm>;
};

/**
 * @category Action Types
 */
export enum IGroupFormActionTypes {
  POST_GROUP_FORM = "POST/group/:groupName/forms",
  POST_GROUP_FORM_VERSION = "POST/group/:groupName/forms/:formId",
  PUT_GROUP_FORM = "PUT/group/:groupName/forms",
  GET_GROUP_FORMS = "GET/group/:groupName/forms",
  GET_GROUP_FORM_BY_ID = "GET/group/:groupName/forms/:formId",
  DELETE_GROUP_FORM = "DELETE/group/:groupName/forms/:ids"
}
