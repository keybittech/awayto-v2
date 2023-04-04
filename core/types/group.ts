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
 */
export type IGroup = {
  id: string;
  externalId: string;
  createdSub: string;
  createdOn: string;
  defaultRoleId: string;
  allowedDomains: string;
  name: string;
  purpose: string;
  code: string;
  usersCount: number;
  roles: Record<string, IRole>;
}

export type IGroupState = IGroup & {
  groups: Record<string, IGroup>;
  users: Record<string, IUserProfile>;
  isValid: boolean;
  availableGroupAssignments: Record<string, IGroupRoleAuthActions>;
  needCheckName: boolean;
  checkingName: boolean;
  checkedName: string;
  error: Error | string;
};

/**
 * @category Action Types
 */
export enum IGroupActionTypes {
  POST_GROUPS = "POST/groups",
  PUT_GROUPS = "PUT/groups",
  GET_GROUPS = "GET/groups",
  GET_GROUPS_BY_ID = "GET/groups/:id",
  DELETE_GROUPS = "DELETE/groups/:ids",
  DISABLE_GROUPS = "PUT/groups/:id/disable",
  CHECK_GROUPS_NAME = "GET/groups/valid/:name",
  POST_GROUPS_USERS_INVITE = "POST/groups/users/invite",
  GROUPS_JOIN = "POST/groups/join/:code",
  GROUPS_LEAVE = "POST/groups/leave/:code",
  PUT_GROUPS_ASSIGNMENTS = "PUT/groups/:groupName/assignments",
  GET_GROUPS_ASSIGNMENTS = "GET/groups/:groupName/assignments"
}

const initialGroupState = {
  groups: {},
  users: {},
  checkedName: '',
  availableGroupAssignments: {},
  checkingName: false,
  error: '',
  isValid: false,
  needCheckName: false
} as IGroupState;