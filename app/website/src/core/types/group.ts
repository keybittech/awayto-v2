import dayjs from 'dayjs';
import { PayloadAction, IRole, IUserProfile, IService, IServiceAddon, ISchedule, IForm } from '.';
import { Merge } from '../util';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState {
    group: IGroupState;
    groupService: IGroupServiceState;
    groupServiceAddon: IGroupServiceAddonState;
    groupSchedule: IGroupScheduleState;
    groupForm: IGroupFormState;
    groupUserSchedule: IGroupUserScheduleState;
  }


  interface IMergedState extends Merge<Merge<Merge<Merge<Merge<Merge<Merge<unknown, IGroupRoleActionState>, IGroupState>, IGroupServiceState>, IGroupServiceAddonState>, IGroupScheduleState>, IGroupFormState>, IGroupUserScheduleState> { }
  /**
   * @category Awayto Redux
   */
  type IGroupModuleActions = IGroupActions | IGroupServiceActions | IGroupServiceAddonActions | IGroupScheduleActions | IGroupFormActions | IGroupUserSchedule;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    group: IGroupActionTypes;
    groupService: IGroupServiceActionTypes;
    groupServiceAddon: IGroupServiceAddonActionTypes;
    groupSchedule: IGroupScheduleActionTypes;
    groupForm: IGroupFormActionTypes;
    groupUserSchedule: IGroupUserScheduleActionTypes;
  }
}

/**
 * @category Authorization
 */
export type IGroupRoleActions = {
  id?: string;
  fetch?: boolean;
  actions: {
    id?: string;
    name: string;
  }[];
}

export type IGroupRoleActionState = {
  assignments: Record<string, IGroupRoleActions>;
};

/**
 * @category Awayto
 */
export type IGroup = {
  id: string;
  externalId: string;
  createdSub: string;
  createdOn: string;
  roleId: string;
  name: string;
  code: string;
  usersCount: number;
  roles: Map<string, IRole>;
}

export type IGroupState = IGroup & {
  groups: Map<string, IGroup>;
  users: Map<string, IUserProfile>;
  isValid: boolean;
  availableGroupAssignments: Record<string, IGroupRoleActions>;
  needCheckName: boolean;
  checkingName: boolean;
  checkedName: string;
  error: Error | string;
};

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
  POST_GROUPS_USERS_INVITE = "POST/groups/users/invite",
  GROUPS_JOIN = "POST/groups/join/:code",
  GROUPS_LEAVE = "POST/groups/leave/:code",
  PUT_GROUPS_ASSIGNMENTS = "PUT/groups/:groupName/assignments",
  GET_GROUPS_ASSIGNMENTS = "GET/groups/:groupName/assignments"
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
export type IGroupsUsersInviteAction = PayloadAction<IGroupActionTypes.POST_GROUPS_USERS_INVITE, IGroupState>;

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
export type IGetGroupsAssignmentsAction = PayloadAction<IGroupActionTypes.GET_GROUPS_ASSIGNMENTS, IGroupState>;

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
  | IGroupsLeaveAction
  | IGetGroupsAssignmentsAction;




/**
 * @category Group
 */
export type IGroupServiceAddon = IServiceAddon & {
  groupId: string;
};

/**
 * @category Group
 */
export type IGroupServiceAddonState = {
  groupServiceAddons: Map<string, IGroupServiceAddon>;
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
};

/**
 * @category Group
 */
export type IGroupServiceState = IGroupService & {
  groupServices: Map<string, IGroupService>
};

/**
 * @category Action Types
 */
export enum IGroupServiceActionTypes {
  POST_GROUP_SERVICE = "POST/group/:groupName/services/:serviceId",
  GET_GROUP_SERVICES = "GET/group/:groupName/services",
  DELETE_GROUP_SERVICE = "DELETE/group/:groupName/services/:ids"
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



/**
 * @category Group
 */
export type IGroupScheduleDateSlots = {
  weekStart: string;
  startTime: string;
  startDate: string;
  scheduleBracketSlotId: string;
  hour: number;
  minute: number;
  time: dayjs.Dayjs;
}

/**
 * @category Group
 */
export type IGroupSchedule = ISchedule & {
  master: true;
  groupId: string;
};

/**
 * @category Group
 */
export type IGroupScheduleState = IGroupSchedule & {
  groupSchedules: Map<string, IGroupSchedule>;
  dateSlots: IGroupScheduleDateSlots[];
};

/**
 * @category Action Types
 */
export enum IGroupScheduleActionTypes {
  POST_GROUP_SCHEDULE = "POST/group/:groupName/schedules",
  PUT_GROUP_SCHEDULE = "PUT/group/:groupName/schedules",
  GET_GROUP_SCHEDULES = "GET/group/:groupName/schedules",
  GET_GROUP_SCHEDULE_BY_DATE = "GET/group/:groupName/schedules/:scheduleId/date/:date/timezone/:timezone",
  GET_GROUP_SCHEDULE_MASTER_BY_ID = "GET/group/:groupName/schedulemaster/:scheduleId",
  DELETE_GROUP_SCHEDULE = "DELETE/group/:groupName/schedules/:ids"
}

/**
 * @category Group
 */
export type IPostGroupScheduleAction = PayloadAction<IGroupScheduleActionTypes.POST_GROUP_SCHEDULE, IGroupSchedule[]>;


/**
 * @category Group
 */
export type IPutGroupScheduleAction = PayloadAction<IGroupScheduleActionTypes.PUT_GROUP_SCHEDULE, IGroupSchedule[]>;

/**
 * @category Group
 */
export type IGetGroupSchedulesAction = PayloadAction<IGroupScheduleActionTypes.GET_GROUP_SCHEDULES, IGroupSchedule[]>;

/**
 * @category Group
 */
export type IGetGroupScheduleDateSlotsAction = PayloadAction<IGroupScheduleActionTypes.GET_GROUP_SCHEDULE_BY_DATE, IGroupScheduleDateSlots[]>;

/**
 * @category Group
 */
export type IGetGroupScheduleMasterByIdAction = PayloadAction<IGroupScheduleActionTypes.GET_GROUP_SCHEDULE_MASTER_BY_ID, IGroupSchedule[]>;

/**
 * @category Group
 */
export type IDeleteGroupScheduleAction = PayloadAction<IGroupScheduleActionTypes.DELETE_GROUP_SCHEDULE, IGroupSchedule[]>;

/**
 * @category Group
 */
export type IGroupScheduleActions = IPostGroupScheduleAction
  | IPutGroupScheduleAction
  | IGetGroupSchedulesAction
  | IGetGroupScheduleDateSlotsAction
  | IGetGroupScheduleMasterByIdAction
  | IDeleteGroupScheduleAction;




/**
 * @category Group
 */
export type IGroupForm = IForm & {
  id: string;
  groupId: string;
  formId: string;
};

/**
 * @category Group
 */
export type IGroupForms = Record<string, IGroupForm>;

/**
 * @category Group
 */
export type IGroupFormState = IGroupForm & {
  groupForms: Map<string, IGroupForm>;
};

/**
 * @category Action Types
 */
export enum IGroupFormActionTypes {
  POST_GROUP_FORM = "POST/group/:groupName/forms",
  POST_GROUP_FORM_VERSION = "POST/group/:groupName/forms/:formId",
  PUT_GROUP_FORM = "PUT/group/:groupName/forms",
  GET_GROUP_FORMS = "GET/group/:groupName/forms",
  GET_GROUP_FORM_BY_ID = "GET/group/:groupName/forms/:formId",
  DELETE_GROUP_FORM = "DELETE/group/:groupName/forms/:ids"
}

/**
 * @category Group
 */
export type IPostGroupFormAction = PayloadAction<IGroupFormActionTypes.POST_GROUP_FORM, IGroupForm[]>;

/**
 * @category Group
 */
export type IPostGroupFormVersionAction = PayloadAction<IGroupFormActionTypes.POST_GROUP_FORM_VERSION, IGroupForm[]>;

/**
 * @category Group
 */
export type IPutGroupFormAction = PayloadAction<IGroupFormActionTypes.PUT_GROUP_FORM, IGroupForm[]>;

/**
 * @category Group
 */
export type IGetGroupFormsAction = PayloadAction<IGroupFormActionTypes.GET_GROUP_FORMS, IGroupForm[]>;

/**
 * @category Group
 */
export type IGetGroupFormByIdAction = PayloadAction<IGroupFormActionTypes.GET_GROUP_FORM_BY_ID, IGroupForm[]>;

/**
 * @category Group
 */
export type IDeleteGroupFormAction = PayloadAction<IGroupFormActionTypes.DELETE_GROUP_FORM, IGroupForm[]>;

/**
 * @category Group
 */
export type IGroupFormActions = IPostGroupFormAction
  | IPostGroupFormVersionAction
  | IPutGroupFormAction
  | IGetGroupFormsAction
  | IGetGroupFormByIdAction
  | IDeleteGroupFormAction;

/**
 * @category Group
 */
export type IGroupUserScheduleStub = {
  groupScheduleId: string;
  userScheduleId: string;
  quoteId: string;
  slotDate: string;
  startTime: string;
  serviceName: string;
  tierName: string;
  replacement?: {
    username: string;
    slotDate: string;
    scheduleBracketSlotId: string;
    serviceTierId: string;
  } 
}

/**
 * @category Group
 */
export type IGroupUserSchedule = ISchedule & {
  id: string;
  groupScheduleId: string;
  userScheduleId: string;
  services: Map<string, IService>;
}

/**
 * @category Group
 */
export type IGroupUserScheduleState = IGroupUserScheduleStub & IGroupUserSchedule & {
  groupUserSchedules: Map<string, IGroupUserSchedule>;
  stubs: IGroupUserScheduleStub[];
};

/**
 * @category Action Types
 */
export enum IGroupUserScheduleActionTypes {
  POST_GROUP_USER_SCHEDULE = "POST/group/:groupName/schedules/:groupScheduleId/user/:userScheduleId",
  PUT_GROUP_USER_SCHEDULE = "PUT/group/:groupName/schedules/:groupScheduleId/user",
  GET_GROUP_USER_SCHEDULES = "GET/group/:groupName/schedules/:groupScheduleId/user",
  GET_GROUP_USER_SCHEDULE_STUBS = "GET/group/:groupName/schedules/user/stub",
  GET_GROUP_USER_SCHEDULE_BY_ID = "GET/group/:groupName/schedules/:groupScheduleId/user/:userScheduleId",
  DELETE_GROUP_USER_SCHEDULE_BY_USER_SCHEDULE_ID = "DELETE/group/:groupName/schedules/user/:ids"
}

/**
 * @category Group
 */
export type IPostGroupUserScheduleAction = PayloadAction<IGroupUserScheduleActionTypes.POST_GROUP_USER_SCHEDULE, IGroupUserSchedule[]>;

/**
 * @category Group
 */
export type IPutGroupUserScheduleAction = PayloadAction<IGroupUserScheduleActionTypes.PUT_GROUP_USER_SCHEDULE, IGroupUserSchedule[]>;

/**
 * @category Group
 */
export type IGetGroupUserSchedulesAction = PayloadAction<IGroupUserScheduleActionTypes.GET_GROUP_USER_SCHEDULES, IGroupUserSchedule[]>;

/**
 * @category Group
 */
export type IGetGroupUserScheduleStubsAction = PayloadAction<IGroupUserScheduleActionTypes.GET_GROUP_USER_SCHEDULE_STUBS, { stubs: IGroupUserScheduleStub[] }>;

/**
 * @category Group
 */
export type IGetGroupUserScheduleByIdAction = PayloadAction<IGroupUserScheduleActionTypes.GET_GROUP_USER_SCHEDULE_BY_ID, IGroupUserSchedule[]>;

/**
 * @category Group
 */
export type IDeleteGroupUserScheduleAction = PayloadAction<IGroupUserScheduleActionTypes.DELETE_GROUP_USER_SCHEDULE_BY_USER_SCHEDULE_ID, IGroupUserSchedule[]>;

/**
 * @category Group
 */
export type IGroupUserScheduleActions = IPostGroupUserScheduleAction
  | IPutGroupUserScheduleAction
  | IGetGroupUserSchedulesAction
  | IGetGroupUserScheduleStubsAction
  | IGetGroupUserScheduleByIdAction
  | IDeleteGroupUserScheduleAction;