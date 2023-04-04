import { Merge } from '../util';
import { IUserProfile } from './profile';

declare global {
  interface IMergedState extends Merge<IUserState> {}
}

/**
 * @category User
 */
export type IUser = IUserProfile;

/**
 * @category User
 */
export type IUsers = Record<string, IUser>;

/**
 * @category User
 */
export type IUserState = {
  users: Record<string, IUserProfile>;
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

const initialUserState = {
  users: {}
} as IUserState;

// case IUserActionTypes.PUT_USERS:
//   case IUserActionTypes.POST_USERS:
//   case IUserActionTypes.GET_USERS_BY_ID:
//   case IUserActionTypes.GET_USERS:
//     // state.users = new Map([ ...state.users ].concat( action.payload.map(usr => {
//     //   usr.groups = new Map(Object.entries(usr.groups || {}) as Iterable<readonly [string, IGroup]>);
//     //   return  [usr.id, usr];
//     // }) as readonly [string, IUserProfile][] ));