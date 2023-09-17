import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';
import { IRole } from './role';

/**
 * @category Group Role
 * @purpose extends a Role to include information about the Group it is attached to
 */
export type IGroupRole = IRole & {
  groupId: string;
  roleId: string;
  externalId: string;
}

/**
 * @category Group Role
 */
export default {
  postGroupRole: {
    kind: EndpointType.MUTATION,
    url: 'group/roles',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { role: {} as IRole },
    resultType: { success: true as boolean }
  },
  putGroupRoles: {
    kind: EndpointType.MUTATION,
    url: 'group/roles',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {
      defaultRoleId: '' as string,
      roles: {} as Record<string, IRole>,
    },
    resultType: { success: true as boolean }
  },
  getGroupRoles: {
    kind: EndpointType.QUERY,
    url: 'group/roles',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IGroupRole[]
  },
  deleteGroupRole: {
    kind: EndpointType.MUTATION,
    url: 'group/roles/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { ids: '' as string },
    resultType: [] as { id: string }[]
  },
} as const;