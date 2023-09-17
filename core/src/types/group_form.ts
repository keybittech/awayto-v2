import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';
import { IForm, IFormVersion } from './form';

/**
 * @category Group Form
 * @purpose extends a Form to include information about the Group it is attached to
 */
export type IGroupForm = IForm & {
  id: string;
  groupId: string;
  formId: string;
};

/**
 * @category Group Form
 */
export default {
  postGroupForm: {
    kind: EndpointType.MUTATION,
    url: 'group/forms',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { name: '' as string, version: {} as IFormVersion },
    resultType: [] as IGroupForm[]
  },
  postGroupFormVersion: {
    kind: EndpointType.MUTATION,
    url: 'group/forms/:formId',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { formId: '' as string, name: '' as string, version: {} as IFormVersion } as IGroupForm,
    resultType: [] as IGroupForm[]
  },
  putGroupForm: {
    kind: EndpointType.MUTATION,
    url: 'group/forms',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {} as IGroupForm,
    resultType: {} as IGroupForm
  },
  getGroupForms: {
    kind: EndpointType.QUERY,
    url: 'group/forms',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IGroupForm[]
  },
  getGroupFormById: {
    kind: EndpointType.QUERY,
    url: 'group/forms/:formId',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { formId: '' as string },
    resultType: {} as IGroupForm
  },
  deleteGroupForm: {
    kind: EndpointType.MUTATION,
    url: 'group/forms/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { ids: '' as string },
    resultType: [] as { id: string }[]
  },
} as const;