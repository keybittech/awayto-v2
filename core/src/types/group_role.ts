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
    url: 'group/:groupName/roles',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string },
    resultType: { success: true as boolean }
  },
  putGroupRole: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/roles',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string },
    resultType: { success: true as boolean }
  },
  getGroupRoles: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/roles',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string },
    resultType: [] as IGroupRole[]
  },
  deleteGroupRole: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/roles/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, ids: '' as string },
    resultType: [] as { id: string }[]
  },
} as const;