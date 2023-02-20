import { IService } from 'awayto';
import { ITimeUnitNames } from './time_unit';
import { PayloadAction } from '.';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    schedule: IScheduleState;
  }

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
 export type IScheduleBracket = {
  id?: string;
  automatic: boolean;
  scheduleId?: string;
  duration: number;
  multiplier: string;
  services: IService[];
  slots: IScheduleBracketSlot[];
};

export type IScheduleBracketSlot = {
  id?: string;
  scheduleBracketId?: string;
  startTime: string;
}


/**
 * @category Awayto
 */
export type ISchedule = {
  id?: string;
  name: string;
  duration: number | null;
  scheduleTimeUnitId?: string;
  scheduleTimeUnitName?: ITimeUnitNames;
  bracketTimeUnitId?: string;
  bracketTimeUnitName?: ITimeUnitNames;
  slotTimeUnitId?: string;
  slotTimeUnitName?: ITimeUnitNames;
  slotDuration: number;
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