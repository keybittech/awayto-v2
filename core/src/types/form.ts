import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';

/**
 * @category Form
 * @purpose models the shape of a single field on a Form
 */
export type IField = Record<string, string | boolean> & {
  i?: string; // id
  l: string; // label
  v?: string; // value
  h?: string; // helperText
  x?: string; // text
  t?: string; // input type
  d?: string; // defaultValue
  r?: boolean; // required
};

/**
 * @category Form
 * @purpose contains all Fields in all rows of a Form
 */
export type IFormTemplate = Record<string, IField[]>;

/**
 * @category Form
 * @purpose used during Quote submission to record the actual values users typed into the Form
 */
export type IFormSubmission = Record<string, string[]>;

/**
 * @category Form
 * @purpose container for specific Form Versions that are submitting during a Quote request
 */
export type IFormVersionSubmission = {
  id?: string;
  formVersionId: string;
  submission: IFormSubmission;
};

/**
 * @category Form
 * @purpose tracks the different versions of Forms throughout their history
 */
export type IFormVersion = {
  id: string;
  formId: string;
  form: IFormTemplate;
  submission: IFormSubmission;
  createdOn: string;
};

/**
 * @category Form
 * @purpose models the base container of a form that Group users create for Services
 */
export type IForm = {
  id: string;
  name: string;
  version: IFormVersion;
  createdOn: string;
};

/**
 * @category Form
 */
export default {
  postForm: {
    kind: EndpointType.MUTATION,
    url: 'forms',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { name: '' as string, version: {} as IFormVersion },
    resultType: {} as IForm
  },
  postFormVersion: {
    kind: EndpointType.MUTATION,
    url: 'forms/:formId/versions',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: {  name: '' as string, version: {} as IFormVersion },
    resultType: {} as IFormVersion
  },
  putForm: {
    kind: EndpointType.MUTATION,
    url: 'forms',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, name: '' as string },
    resultType: { id: '' as string }
  },
  getForms: {
    kind: EndpointType.QUERY,
    url: 'forms',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IForm[]
  },
  getFormById: {
    kind: EndpointType.QUERY,
    url: 'forms/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IForm
  },
  deleteForm: {
    kind: EndpointType.MUTATION,
    url: 'forms/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IForm
  },
  disableForm: {
    kind: EndpointType.MUTATION,
    url: 'forms/:id/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;