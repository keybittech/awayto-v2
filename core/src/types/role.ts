import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';

/**
 * @category Roles
 * @purpose names the various functionalities of users of a Group
 */
export type IRole = {
  id: string;
  name: string;
  createdOn: string;
}

/**
 * @category Role
 */
export default {
  postRole: {
    kind: EndpointType.MUTATION,
    url: 'roles',
    method: 'POST',
    opts: {
      throttle: 1
    } as ApiOptions,
    queryArg: { name: '' as string },
    resultType: {} as IRole
  },
  putRole: {
    kind: EndpointType.MUTATION,
    url: 'roles',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {} as IRole,
    resultType: {} as IRole
  },
  getRoles: {
    kind: EndpointType.QUERY,
    url: 'roles',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IRole[]
  },
  getRoleById: {
    kind: EndpointType.QUERY,
    url: 'roles/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IRole
  },
  deleteRole: {
    kind: EndpointType.MUTATION,
    url: 'roles/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { ids: '' as string },
    resultType: [] as { id: string }[]
  }
} as const;