import { Merge } from '../util';
import { ITimeUnitNames } from './time_unit';
import { IQuote } from './quote';
import { IService } from './service';

declare global {
  interface IMergedState extends Merge<IScheduleState & IScheduleBracketState> {}
}

/**
 * @category Schedule
 */
export enum BookingModes {
  FIRST_COME = "First Come First Served",
  DISTRIBUTED = "Distributed"
}

/**
 * @category Schedule
 */
export type ScheduledParts = {
  ids?: string[];
  type: string;
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
  quotes: Record<string, IQuote>;
  createdOn: string;
};

/**
 * @category Schedule
 */
export type IScheduleBracketState = IScheduleBracket & {
  brackets: Record<string, IScheduleBracket>;
}

/**
 * @category Schedule
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
  DELETE_SCHEDULE = "DELETE/schedules/:ids",
  DISABLE_SCHEDULE = "PUT/schedules/:id/disable"
}

const initialScheduleState = {
  schedules: {}
} as IScheduleState;

// case IScheduleActionTypes.PUT_SCHEDULE:
//   case IScheduleActionTypes.POST_SCHEDULE:
//   case IScheduleActionTypes.GET_SCHEDULE_BY_ID:
//   case IScheduleActionTypes.GET_SCHEDULES:
//     // state.schedules = new Map([ ...state.schedules ]
//     //   .concat( action.payload.map(sched => {
//     //     sched.brackets = new Map(Object.entries(sched.brackets || {}) as Iterable<readonly [string, IScheduleBracket]>);

//     //     for (const bracket of sched.brackets.values()) {
//     //       bracket.services = new Map(Object.entries(bracket.services || {}) as Iterable<readonly [string, IService]>);
//     //       bracket.slots = new Map(Object.entries(bracket.slots || {}) as Iterable<readonly [string, IScheduleBracketSlot]>);
//     //     }
        
//     //     return  [sched.id, sched];
//     //   }) as readonly [string, ISchedule][] ));