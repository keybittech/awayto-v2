import { Merge } from '../util';
import { IGroup } from './group';

declare global {
  interface IMergedState extends Merge<IManageGroupsState> {}
}

/**
 * @category Manage Groups
 */
export type IManageGroups = Record<string, IGroup>;

/**
 * @category Manage Groups
 */
export type IManageGroupsState = IManageGroups & {
  groups: Record<string, IGroup>;
  isValid: boolean;
  needCheckName: boolean;
  checkingName: boolean;
  checkedName: string;
};

/**
 * @category Action Types
 */
export enum IManageGroupsActionTypes {
  GET_MANAGE_GROUPS = "GET/manage/groups",
  CHECK_GROUP_NAME = "GET/manage/groups/valid/:name",
  POST_MANAGE_GROUPS = "POST/manage/groups",
  PUT_MANAGE_GROUPS = "PUT/manage/groups",
  DELETE_MANAGE_GROUPS = "DELETE/manage/groups",
  DISABLE_MANAGE_GROUPS = "PUT/manage/groups/disable",
}

const initialManageGroupsState = {
  groups: {},
  isValid: true,
  needCheckName: false,
  checkingName: false,
  checkedName: ''
} as IManageGroupsState;