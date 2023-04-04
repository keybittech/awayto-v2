
  

import { Merge } from '../util';
import { IUserProfile } from './profile';

declare global {
  interface IMergedState extends Merge<IGroupUserState> { }
}

/**
 * @category Group User
 */
export type IGroupUser = IUserProfile & {
  groupId: string;
  userId: string;
  userSub: string;
  externalId: string;
  groupExternalId: string;
  roleId: string;
  roleName: string;
};

/**
 * @category Group User
 */
export type IGroupUsers = Record<string, IGroupUser>;

/**
 * @category Group User
 */
export type IGroupUserState = IGroupUser & {
  groupUsers: Record<string, IGroupUser>;
};

/**
 * @category Action Types
 */
export enum IGroupUserActionTypes {
  POST_GROUP_USER = "POST/group/:groupName/users",
  PUT_GROUP_USER = "PUT/group/:groupName/users",
  GET_GROUP_USERS = "GET/group/:groupName/users",
  GET_GROUP_USER_BY_ID = "GET/group/:groupName/users/:userId",
  DELETE_GROUP_USER = "DELETE/group/:groupName/users/:ids",
  LOCK_GROUP_USER = "PUT/group/:groupName/users/:ids/lock",
  UNLOCK_GROUP_USER = "PUT/group/:groupName/users/:ids/unlock"
}

const initialGroupUserState = {
  groupUsers: {}
} as IGroupUserState;