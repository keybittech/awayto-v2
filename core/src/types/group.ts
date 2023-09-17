import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';
import { IUserProfile } from './profile';
import { IRole } from './role';

/**
 * @category Authorization
 */
export type IGroupRoleAuthActions = {
  id?: string;
  fetch?: boolean;
  actions: {
    id?: string;
    name: string;
  }[];
}

/**
 * @category Authorization
 */
export type IGroupRoleActionState = {
  assignments: Record<string, IGroupRoleAuthActions>;
};

/**
 * @category Group
 * @purpose contains the major properties of a Group which has many Users with Schedules who perform Services that can be requested with a Quote and finalized with a Booking
 */
export type IGroup = {
  id: string;
  externalId: string;
  createdSub: string;
  createdOn: string;
  defaultRoleId: string;
  allowedDomains: string;
  displayName: string;
  name: string;
  purpose: string;
  ldr: boolean;
  code: string;
  usersCount: number;
  roles: Record<string, IRole>;
  users: Record<string, IUserProfile>;
  availableGroupAssignments: Record<string, IGroupRoleAuthActions>;

  isValid: boolean;
  needCheckName: boolean;
  checkingName: boolean;
  checkedName: string;
  error: Error | string;

  active: boolean;
}

/**
 * @category Group
 */
export default {
  postGroup: {
    kind: EndpointType.MUTATION,
    url: 'group',
    method: 'POST',
    opts: {
      load: true
    } as ApiOptions,
    queryArg: {
      name: '' as string,
      displayName: '' as string,
      purpose: '' as string,
      allowedDomains: '' as string
    },
    resultType: { id: '' as string }
  },
  putGroup: {
    kind: EndpointType.MUTATION,
    url: 'group',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {
      id: '' as string,
      name: '' as string,
      displayName: '' as string,
      allowedDomains: '' as string,
      purpose: '' as string,
    },
    resultType: { id: '' as string }
  },
  putGroupAssignments: {
    kind: EndpointType.MUTATION,
    url: 'group/assignments',
    method: 'PUT',
    opts: {
      throttle: 60
    } as ApiOptions,
    queryArg: { assignments: {} as Record<string, { actions: { name: string }[] }> },
    resultType: { success: true as boolean }
  },
  getGroupAssignments: {
    kind: EndpointType.QUERY,
    url: 'group/assignments',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: {} as Record<string, IGroupRoleAuthActions>
  },
  deleteGroup: {
    kind: EndpointType.MUTATION,
    url: 'group',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { ids: '' as string },
    resultType: [] as { id: string }[]
  },
  checkGroupName: {
    kind: EndpointType.QUERY,
    url: 'group/valid/:name',
    method: 'GET',
    opts: {
      cache: null,
      load: true
    } as ApiOptions,
    queryArg: { name: '' as string },
    resultType: { isValid: true as boolean }
  },
  inviteGroupUser: {
    kind: EndpointType.MUTATION,
    url: 'group/users/invite',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { users: [] as { email: string }[] },
    resultType: { users: [] as { email: string }[] }
  },
  joinGroup: {
    kind: EndpointType.MUTATION,
    url: 'group/join/:code',
    method: 'POST',
    opts: { cache: 'skip' } as ApiOptions,
    queryArg: { code: '' as string },
    resultType: { success: true as boolean }
  },
  leaveGroup: {
    kind: EndpointType.MUTATION,
    url: 'group/leave/:code',
    method: 'POST',
    opts: { cache: 'skip' } as ApiOptions,
    queryArg: { code: '' as string },
    resultType: { success: true as boolean }
  },
  attachUser: {
    kind: EndpointType.MUTATION,
    url: 'group/attach/user',
    method: 'POST',
    opts: { cache: 'skip' } as ApiOptions,
    queryArg: { code: '' as string },
    resultType: { success: true }
  }
} as const;