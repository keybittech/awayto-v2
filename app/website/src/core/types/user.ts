import { IUserProfile, PayloadAction } from '.';
import { Merge } from '../util';

declare global {
  interface IMergedState extends Merge<IUserState> {}
}

/**
 * @category Awayto
 */
export type IUser = IUserProfile;

/**
 * @category Manage Users
 */
export type IUsers = Record<string, IUser>;

/**
 * @category Manage Users
 */
export type IUserState = {
  users: Map<string, IUserProfile>;
}

/**
 * @category Action Types
 */
export enum IUserActionTypes {
  POST_USERS = "POST/users",
  PUT_USERS = "PUT/users",
  GET_USERS = "GET/users",
  GET_USERS_BY_ID = "GET/users/:id",
  DELETE_USERS = "DELETE/users/:id",
  DISABLE_USERS = "PUT/users/:id/disable"
}

/**
 * @category User
 */
export type IPostUserAction = PayloadAction<IUserActionTypes.POST_USERS, IUser[]>;

/**
 * @category User
 */
export type IPutUserAction = PayloadAction<IUserActionTypes.PUT_USERS, IUser[]>;

/**
 * @category User
 */
export type IGetUsersAction = PayloadAction<IUserActionTypes.GET_USERS, IUser[]>;

/**
 * @category User
 */
export type IGetUserByIdAction = PayloadAction<IUserActionTypes.GET_USERS_BY_ID, IUser[]>;

/**
 * @category User
 */
export type IDeleteUserAction = PayloadAction<IUserActionTypes.DELETE_USERS, IUser[]>;

/**
 * @category User
 */
export type IDisableUserAction = PayloadAction<IUserActionTypes.DISABLE_USERS, IUser[]>;

/**
 * @category User
 */
export type IUserActions = IPostUserAction 
  | IPutUserAction 
  | IGetUsersAction 
  | IGetUserByIdAction
  | IDeleteUserAction
  | IDisableUserAction;
