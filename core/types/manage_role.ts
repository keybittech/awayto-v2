import { Merge } from '../util';
import { IRole } from './role';

declare global {
  interface IMergedState extends Merge<IManageRolesState> {}
}

/**
 * @category Manage Roles
 */
export type IManageRoles = Record<string, IRole>;

/**
 * @category Manage Roles
 */
export type IManageRolesState = IManageRoles & {
  roles: Record<string, IRole>;
};

/**
 * @category Action Types
 */
export enum IManageRolesActionTypes {
  GET_MANAGE_ROLES = "GET/manage/roles",
  POST_MANAGE_ROLES = "POST/manage/roles",
  PUT_MANAGE_ROLES = "PUT/manage/roles",
  DELETE_MANAGE_ROLES = "DELETE/manage/roles",
}

const initialManageRolesState = {
  roles: {}
} as IManageRolesState;