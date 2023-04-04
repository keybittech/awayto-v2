import { IRole } from "./role";

/**
 * @category Group Role
 */
export type IGroupRole = IRole & {
  groupId: string;
  roleId: string;
  externalId: string;
}

/**
 * @category Group Role
 */
export type IGroupRoles = Record<string, IGroupRole>;

/**
 * @category Group Role
 */
export type IGroupRoleState = IGroupRole & {
  groupRoles: Record<string, IGroupRole>;
};

/**
 * @category Action Types
 */
export enum IGroupRoleActionTypes {
  POST_GROUP_ROLE = "POST/group/:groupName/roles",
  PUT_GROUP_ROLE = "PUT/group/:groupName/roles",
  GET_GROUP_ROLES = "GET/group/:groupName/roles",
  DELETE_GROUP_ROLE = "DELETE/group/:groupName/roles/:ids"
}

const initialGroupRoleState = {
  groupRoles: {}
} as IGroupRoleState;