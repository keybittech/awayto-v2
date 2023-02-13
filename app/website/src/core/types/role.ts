import { PayloadAction } from '.';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    role: IRoleState
  }

  /**
   * @category Awayto Redux
   */
  type IRoleModuleActions = IRoleActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    role: IRoleActionTypes;
  }
}

/**
 * @category Awayto
 */
export type IRole = {
  id: string;
  name: string;
  createdOn: string;
}

/**
 * @category Manage Roles
 */
export type IRoles = Record<string, IRole>;

/**
 * @category Manage Roles
 */
export type IRoleState = {
  roles: IRoles
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

/**
 * @category Role
 */
export type IPostRoleAction = PayloadAction<IRoleActionTypes.POST_ROLES, IRole[]>;

/**
 * @category Role
 */
export type IPutRoleAction = PayloadAction<IRoleActionTypes.PUT_ROLES, IRole[]>;

/**
 * @category Role
 */
export type IGetRolesAction = PayloadAction<IRoleActionTypes.GET_ROLES, IRole[]>;

/**
 * @category Role
 */
export type IGetRoleByIdAction = PayloadAction<IRoleActionTypes.GET_ROLES_BY_ID, IRole[]>;

/**
 * @category Role
 */
export type IDeleteRoleAction = PayloadAction<IRoleActionTypes.DELETE_ROLES, IRole[]>;

/**
 * @category Role
 */
export type IDisableRoleAction = PayloadAction<IRoleActionTypes.DISABLE_ROLES, IRole[]>;

/**
 * @category Role
 */
export type IRoleActions = IPostRoleAction 
  | IPutRoleAction 
  | IGetRolesAction 
  | IGetRoleByIdAction
  | IDeleteRoleAction
  | IDisableRoleAction;
