import { Merge } from '../util';

declare global {
  interface IMergedState extends Merge<IRoleState> {}
}

/**
 * @category Roles
 */
export type IRole = {
  id: string;
  name: string;
  createdOn: string;
}

/**
 * @category Roles
 */
export type IRoleState = IRole & {
  roles: Record<string, IRole>
}

/**
 * @category Action Types
 */
export enum IRoleActionTypes {
  POST_ROLES = "POST/roles",
  PUT_ROLES = "PUT/roles",
  GET_ROLES = "GET/roles",
  GET_ROLES_BY_ID = "GET/roles/:id",
  DELETE_ROLES = "DELETE/roles/:ids",
  DISABLE_ROLES = "PUT/roles/:id/disable"
}

