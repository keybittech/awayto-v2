import { IManageGroupsState } from "./manage_group";
import { IManageRolesState } from "./manage_role";
import { IManageUsersState } from "./manage_user";
import { Merge } from '../util';

declare global {
  interface IMergedState extends Merge<IManageState> {}
}

/**
 * @category Manage
 */
export type IManage = {
  manageUsers: IManageUsersState;
  manageRoles: IManageRolesState;
  manageGroups: IManageGroupsState;
};

/**
 * @category Manage
 */
export type IManageState = IManage;

/**
 * @category Action Types
 */
export enum IManageActionTypes {
  GET_MODULES = "manage/GET_MODULES"
}