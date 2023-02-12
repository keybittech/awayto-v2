import { PayloadAction, IRole, IUserProfile, IService, IServiceAddon } from '.';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState {
    group: IGroupState;
    groupService: IGroupServiceState;
    groupServiceAddon: IGroupServiceAddonState;
  }

  /**
   * @category Awayto Redux
   */
  type IGroupModuleActions = IGroupActions | IGroupServiceActions | IGroupServiceAddonActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    group: IGroupActionTypes;
    groupService: IGroupServiceActionTypes;
    groupServiceAddon: IGroupServiceAddonActionTypes;
  }
}

/**
 * @category Awayto
 */
export type IGroup = {
  id: string;
  externalId: string;
  createdSub: string;
  roleId: string;
  name: string;
  code: string;
  users: number;
  roles: IRole[];
}

/**
 * @category Groups
 */
export type IGroups = Record<string, IGroup>;

/**
 * @category Groups
 */
export type IGroupState = {
  groups: IGroups,
  users: IUserProfile[],
  isValid: boolean,
  needCheckName: boolean,
  checkingName: boolean,
  checkedName: string,
  error: Error | string
}

/**
 * @category Action Types
 */
export enum IGroupActionTypes {
  POST_GROUPS = "POST/groups",
  PUT_GROUPS = "PUT/groups",
  GET_GROUPS = "GET/groups",
  GET_GROUPS_BY_ID = "GET/groups/:id",
  DELETE_GROUPS = "DELETE/groups/:ids",
  DISABLE_GROUPS = "PUT/groups/:id/disable",
  CHECK_GROUPS_NAME = "GET/groups/valid/:name",
  GROUPS_USERS_INVITE = "POST/groups/users/invite",
  GROUPS_JOIN = "POST/groups/join/:code",
  GROUPS_LEAVE = "POST/groups/leave/:code",
}

/**
 * @category Group
 */
export type IPostGroupAction = PayloadAction<IGroupActionTypes.POST_GROUPS, IGroup[]>;

/**
 * @category Group
 */
export type IPutGroupAction = PayloadAction<IGroupActionTypes.PUT_GROUPS, IGroup[]>;

/**
 * @category Group
 */
export type IGetGroupsAction = PayloadAction<IGroupActionTypes.GET_GROUPS, IGroup[]>;

/**
 * @category Group
 */
export type IGetGroupByIdAction = PayloadAction<IGroupActionTypes.GET_GROUPS_BY_ID, IGroup[]>;

/**
 * @category Group
 */
export type IDeleteGroupAction = PayloadAction<IGroupActionTypes.DELETE_GROUPS, IGroup[]>;

/**
 * @category Group
 */
export type IDisableGroupAction = PayloadAction<IGroupActionTypes.DISABLE_GROUPS, IGroup[]>;

/**
 * @category Group
 */
export type ICheckGroupsNameAction = PayloadAction<IGroupActionTypes.CHECK_GROUPS_NAME, IGroupState>;

/**
 * @category Group
 */
export type IGroupsUsersInviteAction = PayloadAction<IGroupActionTypes.GROUPS_USERS_INVITE, IGroupState>;

/**
 * @category Group
 */
export type IGroupsJoinAction = PayloadAction<IGroupActionTypes.GROUPS_JOIN, IGroupState>;

/**
 * @category Group
 */
export type IGroupsLeaveAction = PayloadAction<IGroupActionTypes.GROUPS_LEAVE, IGroupState>;

/**
 * @category Group
 */
export type IGroupActions = IPostGroupAction
  | IPutGroupAction
  | IGetGroupsAction
  | IGetGroupByIdAction
  | IDeleteGroupAction
  | IDisableGroupAction
  | ICheckGroupsNameAction
  | IGroupsUsersInviteAction
  | IGroupsJoinAction
  | IGroupsLeaveAction;




/**
 * @category Group
 */
export type IGroupServiceAddon = IServiceAddon & {
  groupId: string;
};

/**
 * @category Group
 */
export type IGroupServiceAddons = Record<string, IGroupServiceAddon>;

/**
 * @category Group
 */
export type IGroupServiceAddonState = {
  groupServiceAddons: IGroupServiceAddons;
};

/**
 * @category Action Types
 */
export enum IGroupServiceAddonActionTypes {
  POST_GROUP_SERVICE_ADDON = "POST/group/:groupName/service_addons/:serviceAddonId",
  GET_GROUP_SERVICE_ADDONS = "GET/group/:groupName/service_addons",
  DELETE_GROUP_SERVICE_ADDON = "DELETE/group/:groupName/service_addons/:serviceAddonId"
}

/**
 * @category Group
 */
export type IPostGroupServiceAddonAction = PayloadAction<IGroupServiceAddonActionTypes.POST_GROUP_SERVICE_ADDON, IGroupServiceAddon[]>;

/**
 * @category Group
 */
export type IGetGroupServiceAddonsAction = PayloadAction<IGroupServiceAddonActionTypes.GET_GROUP_SERVICE_ADDONS, IGroupServiceAddon[]>;

/**
 * @category Group
 */
export type IDeleteGroupServiceAddonAction = PayloadAction<IGroupServiceAddonActionTypes.DELETE_GROUP_SERVICE_ADDON, IGroupServiceAddon[]>;

/**
 * @category Group
 */
export type IGroupServiceAddonActions = IPostGroupServiceAddonAction
  | IGetGroupServiceAddonsAction
  | IDeleteGroupServiceAddonAction;




/**
 * @category Group
 */
export type IGroupService = IService & {
  groupId: string;
  groupName: string;
  serviceId: string;
};

/**
 * @category Group
 */
export type IGroupServices = Record<string, IGroupService> | IGroupService[];

/**
 * @category Group
 */
export type IGroupServiceState = {
  groupServices: IGroupServices;
};

/**
 * @category Action Types
 */
export enum IGroupServiceActionTypes {
  POST_GROUP_SERVICE = "POST/group/:groupName/services/:serviceId",
  GET_GROUP_SERVICES = "GET/group/:groupName/services",
  DELETE_GROUP_SERVICE = "DELETE/group/:groupName/services/:serviceId"
}

/**
 * @category Group
 */
export type IPostGroupServiceAction = PayloadAction<IGroupServiceActionTypes.POST_GROUP_SERVICE, IGroupService[]>;

/**
 * @category Group
 */
export type IGetGroupServicesAction = PayloadAction<IGroupServiceActionTypes.GET_GROUP_SERVICES, IGroupService[]>;

/**
 * @category Group
 */
export type IDeleteGroupServiceAction = PayloadAction<IGroupServiceActionTypes.DELETE_GROUP_SERVICE, IGroupService[]>;

/**
 * @category Group
 */
export type IGroupServiceActions = IPostGroupServiceAction
  | IGetGroupServicesAction
  | IDeleteGroupServiceAction;