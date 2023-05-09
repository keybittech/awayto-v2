import { ApiOptions, EndpointType } from './api';
import { IUserProfile } from './profile';

/**
 * @category Group User
 * @purpose extends a User Profile to include details about the user's group roles and external id references
 */
export type IGroupUser = IUserProfile & {
  groupId: string;
  userId: string;
  userSub: string;
  externalId: string;
  groupExternalId: string;
  roleId: string;
  roleName: string;
  groupName: string;
};

/**
 * @category Group User
 */
export type IGroupUsers = Record<string, IGroupUser>;

/**
 * @category Group Users
 */
export default {
  putGroupUser: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/users',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, userId: '' as string, roleId: '' as string, roleName: '' as string },
    resultType: [{ id: '' as string, roleId: '' as string, roleName: '' as string }]
  },
  getGroupUsers: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/users',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string },
    resultType: [] as IGroupUser[]
  },
  getGroupUserById: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/users/:userId',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, userId: '' as string },
    resultType: {} as IGroupUser
  },
  deleteGroupUser: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/users/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, ids: [] as string[] },
    resultType: [] as { id: string }[]
  },
  lockGroupUser: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/users/:ids/lock',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, ids: [] as string[] },
    resultType: [] as { id: string }[]
  },
  unlockGroupUser: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/users/:ids/unlock',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, ids: [] as string[] },
    resultType: [] as { id: string }[]
  }
} as const;