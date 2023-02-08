import { PayloadAction, IRole } from '.';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    groups: IGroupState
  }

  /**
   * @category Awayto Redux
   */
  type IGroupModuleActions = IGroupActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    groups: IGroupActionTypes;
  }
}

/**
 * @category Awayto
 */
export type IGroup = {
  id: string;
  name: string;
  users: number;
  roles: IRole[];
}

/**
 * @category Manage Groups
 */
export type IGroups = Record<string, IGroup>;

/**
 * @category Manage Groups
 */
export type IGroupState = {
  groups: IGroups,
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
export type IGroupActions = IPostGroupAction 
  | IPutGroupAction 
  | IGetGroupsAction 
  | IGetGroupByIdAction
  | IDeleteGroupAction
  | IDisableGroupAction
  | ICheckGroupsNameAction;
