import { IService, LogoutAction } from 'awayto';
import { PayloadAction } from '.';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    schedule: IScheduleState;
    scheduleContext: IScheduleContextState;
  }

  /**
   * @category Awayto Redux
   */
  type IScheduleModuleActions = IScheduleActions | IScheduleContextActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    schedules: IScheduleActionTypes;
    scheduleContexts: IScheduleContextActionTypes;
  }
}

/**
 * @category ScheduleContext
 */
 export type IScheduleContext = {
  id: string;
  name: string;
};


/**
 * @category ScheduleContext
 */
export type IScheduleContextState = {
  items: Record<string, IScheduleContext>;
};

/**
 * @category Action Types
 */
export enum IScheduleContextActionTypes {
  POST_SCHEDULE_CONTEXT = "POST/schedule_contexts",
  PUT_SCHEDULE_CONTEXT = "PUT/schedule_contexts",
  GET_SCHEDULE_CONTEXTS = "GET/schedule_contexts",
  GET_SCHEDULE_CONTEXT_BY_ID = "GET/schedule_contexts/:id",
  DELETE_SCHEDULE_CONTEXT = "DELETE/schedule_contexts/:id",
  DISABLE_SCHEDULE_CONTEXT = "PUT/schedule_contexts/:id/disable"
}

/**
 * @category ScheduleContext
 */
export type IPostScheduleContextAction = PayloadAction<IScheduleContextActionTypes.POST_SCHEDULE_CONTEXT, IScheduleContext>;

/**
 * @category ScheduleContext
 */
export type IPutScheduleContextAction = PayloadAction<IScheduleContextActionTypes.PUT_SCHEDULE_CONTEXT, IScheduleContext>;

/**
 * @category ScheduleContext
 */
export type IGetScheduleContextsAction = PayloadAction<IScheduleContextActionTypes.GET_SCHEDULE_CONTEXTS, IScheduleContext[]>;

/**
 * @category ScheduleContext
 */
export type IGetScheduleContextByIdAction = PayloadAction<IScheduleContextActionTypes.GET_SCHEDULE_CONTEXT_BY_ID, IScheduleContext>;

/**
 * @category ScheduleContext
 */
export type IDeleteScheduleContextAction = PayloadAction<IScheduleContextActionTypes.DELETE_SCHEDULE_CONTEXT, IScheduleContext[]>;

/**
 * @category ScheduleContext
 */
export type IDisableScheduleContextAction = PayloadAction<IScheduleContextActionTypes.DISABLE_SCHEDULE_CONTEXT, IScheduleContext[]>;

/**
 * @category ScheduleContext
 */
export type IScheduleContextActions = LogoutAction
  | IPostScheduleContextAction 
  | IPutScheduleContextAction 
  | IGetScheduleContextsAction 
  | IGetScheduleContextByIdAction
  | IDeleteScheduleContextAction
  | IDisableScheduleContextAction;





/**
 * @category Schedule
 */
 export type IScheduleTerm = {
  id?: string;
  scheduleId?: string;
  scheduleContextId?: string;
  scheduleContextName: string;
  duration: number;
};

/**
 * @category Schedule
 */
 export type IScheduleBracket = {
  id?: string;
  scheduleId?: string;
  scheduleContextId?: string;
  scheduleContextName: string;
  bracket: number;
  multiplier: string;
};


/**
 * @category Awayto
 */
export type ISchedule = {
  id?: string;
  name: string;
  overbook: boolean;
  services: IService[];
  term: IScheduleTerm;
  brackets: IScheduleBracket[];
};


/**
 * @category Schedule
 */
export type IScheduleState = {
  schedules: Record<string, ISchedule>;
};

/**
 * @category Action Types
 */
export enum IScheduleActionTypes {
  POST_SCHEDULE = "POST/schedules",
  PUT_SCHEDULE = "PUT/schedules",
  GET_SCHEDULES = "GET/schedules",
  GET_SCHEDULE_BY_ID = "GET/schedules/:id",
  DELETE_SCHEDULE = "DELETE/schedules/:id",
  DISABLE_SCHEDULE = "PUT/schedules/:id/disable"
}

/**
 * @category Schedule
 */
export type IPostScheduleAction = PayloadAction<IScheduleActionTypes.POST_SCHEDULE, ISchedule[]>;

/**
 * @category Schedule
 */
export type IPutScheduleAction = PayloadAction<IScheduleActionTypes.PUT_SCHEDULE, ISchedule[]>;

/**
 * @category Schedule
 */
export type IGetSchedulesAction = PayloadAction<IScheduleActionTypes.GET_SCHEDULES, ISchedule[]>;

/**
 * @category Schedule
 */
export type IGetScheduleByIdAction = PayloadAction<IScheduleActionTypes.GET_SCHEDULE_BY_ID, ISchedule[]>;

/**
 * @category Schedule
 */
export type IDeleteScheduleAction = PayloadAction<IScheduleActionTypes.DELETE_SCHEDULE, ISchedule[]>;

/**
 * @category Schedule
 */
export type IDisableScheduleAction = PayloadAction<IScheduleActionTypes.DISABLE_SCHEDULE, ISchedule[]>;

/**
 * @category Schedule
 */
export type IScheduleActions = IPostScheduleAction 
  | IPutScheduleAction 
  | IGetSchedulesAction 
  | IGetScheduleByIdAction
  | IDeleteScheduleAction
  | IDisableScheduleAction;