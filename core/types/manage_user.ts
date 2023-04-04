import { IUserProfile } from "./profile";
import { Merge } from '../util';

declare global {
  interface IMergedState extends Merge<IManageUsersState> {}
}

/**
 * @category Manage Users
 */
export type IManageUsers = Record<string, IUserProfile>;

/**
 * @category Manage Users
 */
export type IManageUsersState = IManageUsers & {
  users: Record<string, IUserProfile>;
};

/**
 * @category Action Types
 */
export enum IManageUsersActionTypes {
  GET_MANAGE_USERS = "GET/manage/users",
  GET_MANAGE_USERS_BY_ID = "GET/manage/users/id/:id",
  GET_MANAGE_USERS_BY_SUB = "GET/manage/users/sub/:sub",
  GET_MANAGE_USERS_INFO = "GET/manage/users/info",
  POST_MANAGE_USERS = "POST/manage/users",
  POST_MANAGE_USERS_APP_ACCT = "POST/manage/users",
  POST_MANAGE_USERS_SUB = "POST/manage/users/sub",
  PUT_MANAGE_USERS = "PUT/manage/users",
  LOCK_MANAGE_USERS = "PUT/manage/users/lock",
  UNLOCK_MANAGE_USERS = "PUT/manage/users/unlock"
}

const initialManageUsersState = {
  users: {}
} as IManageUsersState;