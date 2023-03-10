import { PayloadAction, IUserProfile, IGroup, IRole, } from '.';
import { Merge } from '../util';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    manage: IManageState
    manageUsers: IManageUsersState;
    manageRoles: IManageRolesState;
    manageGroups: IManageGroupsState;
  }

  interface IMergedState extends Merge<Merge<Merge<Merge<unknown, IManageState>, IManageUsersState>, IManageRolesState>, IManageGroupsState> {}

  /**
   * @category Awayto Redux
   */
  type IManageModuleActions = IManageActions | IManageUsersActions | IManageRolesActions | IManageGroupsActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    manage: IManageActionTypes;
    manageUsers: IManageUsersActionTypes;
    manageRoles: IManageRolesActionTypes;
    manageGroups: IManageGroupsActionTypes;
  }
}

/**
 * @category Awayto
 */
export type IManage = {
  manageUsers: IManageUsersState;
  manageRoles: IManageRolesState;
  manageGroups: IManageGroupsState;
};

/**
 * @category Manage
 */
export type IManageState = Partial<IManage>;

/**
 * @category Action Types
 */
export enum IManageActionTypes {
  GET_MODULES = "manage/GET_MODULES"
}

/**
 * @category Manage
 */
export type IGetModulesAction = PayloadAction<IManageActionTypes.GET_MODULES, IManage>;

/**
 * @category Manage
 */
export type IManageActions = IGetModulesAction;



/**
 * @category Awayto
 */
export type IManageUsers = unknown;

/**
 * @category Manage Users
 */
export type IManageUsersState = Partial<IManageUsers> & {
  users: Map<string, IUserProfile>;
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


/**
 * @category Manage Users
 */
export type IGetManageUsersAction = PayloadAction<IManageUsersActionTypes.GET_MANAGE_USERS, IUserProfile[]>;

/**
 * @category Manage Users
 */
export type IGetManageUsersByIdAction = PayloadAction<IManageUsersActionTypes.GET_MANAGE_USERS_BY_ID, IUserProfile[]>;

/**
 * @category Manage Users
 */
export type IGetManageUsersBySubAction = PayloadAction<IManageUsersActionTypes.GET_MANAGE_USERS_BY_SUB, IUserProfile[]>;

/**
 * @category Manage Users
 */
export type IGetManageUsersInfoAction = PayloadAction<IManageUsersActionTypes.GET_MANAGE_USERS_INFO, IUserProfile[]>;

/**
 * @category Manage Users
 */
export type IPostManageUsersAction = PayloadAction<IManageUsersActionTypes.POST_MANAGE_USERS, IUserProfile[]>;

/**
 * @category Manage Users
 */
export type IPostManageUsersSubAction = PayloadAction<IManageUsersActionTypes.POST_MANAGE_USERS_SUB, IUserProfile[]>;

/**
 * @category Manage Users
 */
export type IPostManageUsersAppAcctAction = PayloadAction<IManageUsersActionTypes.POST_MANAGE_USERS_APP_ACCT, IUserProfile[]>;

/**
 * @category Manage Users
 */
export type IPutManageUsersAction = PayloadAction<IManageUsersActionTypes.PUT_MANAGE_USERS, IUserProfile[]>;

/**
 * @category Manage Users
 */
export type ILockManageUsersAction = PayloadAction<IManageUsersActionTypes.LOCK_MANAGE_USERS, IUserProfile[]>;

/**
 * @category Manage Users
 */
export type IUnlockManageUsersAction = PayloadAction<IManageUsersActionTypes.UNLOCK_MANAGE_USERS, IUserProfile[]>;

/**
 * @category Manage Users
 */
export type IManageUsersActions = IGetManageUsersAction
  | IGetManageUsersBySubAction
  | IGetManageUsersByIdAction
  | IGetManageUsersInfoAction
  | IPostManageUsersAction
  | IPostManageUsersSubAction
  | IPostManageUsersAppAcctAction
  | IPutManageUsersAction
  | ILockManageUsersAction
  | IUnlockManageUsersAction;



/**
 * @category Awayto
 */
export type IManageRoles = unknown;

/**
 * @category Manage Roles
 */
export type IManageRolesState = Partial<IManageRoles> & {
  roles: Map<string, IRole>
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

/**
 * @category Manage Roles
 */
export type IGetManageRolesAction = PayloadAction<IManageRolesActionTypes.GET_MANAGE_ROLES, IRole[]>;

/**
 * @category Manage Roles
 */
export type IPostManageRolesAction = PayloadAction<IManageRolesActionTypes.POST_MANAGE_ROLES, IRole[]>;

/**
 * @category Manage Roles
 */
export type IPutManageRolesAction = PayloadAction<IManageRolesActionTypes.PUT_MANAGE_ROLES, IRole[]>;

/**
 * @category Manage Roles
 */
export type IDeleteManageRolesAction = PayloadAction<IManageRolesActionTypes.DELETE_MANAGE_ROLES, IRole[]>;


/**
 * @category Manage Roles
 */
export type IManageRolesActions = IGetManageRolesAction
  | IPostManageRolesAction
  | IPutManageRolesAction
  | IDeleteManageRolesAction;


/**
 * @category Awayto
 */
export type IManageGroups = unknown;

/**
 * @category Manage Groups
 */
export type IManageGroupsState = Partial<IManageGroups> & {
  groups: Map<string, IGroup>,
  isValid: boolean,
  needCheckName: boolean,
  checkingName: boolean,
  checkedName: string
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

/**
 * @category Manage Groups
 */
export type IGetManageGroupsAction = PayloadAction<IManageGroupsActionTypes.GET_MANAGE_GROUPS, IGroup[]>;

/**
 * @category Manage Groups
 */
export type IPostManageGroupsAction = PayloadAction<IManageGroupsActionTypes.POST_MANAGE_GROUPS, IGroup[]>;

/**
 * @category Manage Groups
 */
export type IPutManageGroupsAction = PayloadAction<IManageGroupsActionTypes.PUT_MANAGE_GROUPS, IGroup[]>;

/**
 * @category Manage Groups
 */
export type IDeleteManageGroupsAction = PayloadAction<IManageGroupsActionTypes.DELETE_MANAGE_GROUPS, IGroup[]>;

/**
 * @category Manage Groups
 */
export type IDisableManageGroupsAction = PayloadAction<IManageGroupsActionTypes.DISABLE_MANAGE_GROUPS, IGroup[]>;

/**
 * @category Manage Groups
 */
export type ICheckGroupNameAction = PayloadAction<IManageGroupsActionTypes.CHECK_GROUP_NAME, IManageGroupsState>;


/**
 * @category Manage Groups
 */
export type IManageGroupsActions = IGetManageGroupsAction 
  | ICheckGroupNameAction 
  | IPostManageGroupsAction 
  | IPutManageGroupsAction 
  | IDeleteManageGroupsAction
  | IDisableManageGroupsAction;
