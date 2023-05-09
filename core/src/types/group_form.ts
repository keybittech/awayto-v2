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
  groupName: string;
};

/**
 * @category Group Form
 */
export default {
  postGroupForm: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/forms',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, name: '' as string, version: {} as IFormVersion },
    resultType: [] as IGroupForm[]
  },
  postGroupFormVersion: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/forms/:formId',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { formId: '' as string, groupName: '' as string, name: '' as string, version: {} as IFormVersion } as IGroupForm,
    resultType: [] as IGroupForm[]
  },
  putGroupForm: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/forms',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {} as IGroupForm,
    resultType: {} as IGroupForm
  },
  getGroupForms: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/forms',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string },
    resultType: [] as IGroupForm[]
  },
  getGroupFormById: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/forms/:formId',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, formId: '' as string },
    resultType: {} as IGroupForm
  },
  deleteGroupForm: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/forms/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, ids: '' as string },
    resultType: [] as { id: string }[]
  },
} as const;