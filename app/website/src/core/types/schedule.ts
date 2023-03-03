import { IService, Merge } from 'awayto';
import { ITimeUnitNames } from './time_unit';
import { PayloadAction } from '.';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    schedule: IScheduleState;
  }

  interface IMergedState extends Merge<Merge<unknown, IScheduleState>, IScheduleBracketState> {}

  /**
   * @category Awayto Redux
   */
  type IScheduleModuleActions = IScheduleActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    schedules: IScheduleActionTypes;
  }
}

export enum BookingModes {
  FIRST_COME = "First Come First Served",
  DISTRIBUTED = "Distributed"
}

/**
 * @category Schedule
 */
export type IScheduleBracketSlot = {
  id: string;
  scheduleBracketId: string;
  startTime: string;
}

/**
 * @category Schedule
 */
 export type IScheduleBracket = {
  id: string;
  automatic: boolean;
  scheduleId: string;
  duration: number;
  multiplier: string;
  services: Record<string, IService>;
  slots: Record<string, IScheduleBracketSlot>;
  createdOn: string;
};

export type IScheduleBracketState = IScheduleBracket & {
  schedules: Record<string, IScheduleBracket>;
}


/**
 * @category Awayto
 */
export type ISchedule = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  timezone: string;
  scheduleTimeUnitId: string;
  scheduleTimeUnitName: ITimeUnitNames;
  bracketTimeUnitId: string;
  bracketTimeUnitName: ITimeUnitNames;
  slotTimeUnitId: string;
  slotTimeUnitName: ITimeUnitNames;
  slotDuration: number;
  brackets: Record<string, IScheduleBracket>;
  createdOn: string;
};


/**
 * @category Schedule
 */
export type IScheduleState = ISchedule & {
  schedules: Record<string, ISchedule>;
};

/**
 * @category Action Types
 */
export enum IScheduleActionTypes {
  POST_SCHEDULE = "POST/schedules",
  POST_SCEHDULE_BRACKETS = "POST/schedule/brackets",
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