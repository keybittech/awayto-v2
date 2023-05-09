import { ApiOptions, EndpointType } from './api';
import { IRole } from './role';

/**
 * @category Manage Roles
 */
export type IManageRoles = Record<string, IRole>;

/**
 * @category Manage Roles
 */
export default {
  postManageRoles: {
    kind: EndpointType.MUTATION,
    url: 'manage/roles',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { name: '' as string },
    resultType: { id: '' as string, name: '' as string }
  },
  putManageRoles: {
    kind: EndpointType.MUTATION,
    url: 'manage/roles',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, name: '' as string },
    resultType: { id: '' as string, name: '' as string }
  },
  getManageRoles: {
    kind: EndpointType.QUERY,
    url: 'manage/roles',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Record<string, never>,
    resultType: [] as IRole[]
  },
  deleteManageRoles: {
    kind: EndpointType.MUTATION,
    url: 'manage/roles',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;