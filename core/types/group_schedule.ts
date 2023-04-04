

import dayjs from 'dayjs';
import { Merge } from '../util';
import { ISchedule } from './schedule';

declare global {
  interface IMergedState extends Merge<IGroupScheduleState> { }
}

/**
 * @category Group Schedule
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
 * @category Group Schedule
 */
export type IGroupSchedule = ISchedule & {
  master: true;
  groupId: string;
};

/**
 * @category Group Schedule
 */
export type IGroupScheduleState = IGroupSchedule & {
  groupSchedules: Record<string, IGroupSchedule>;
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

const initialGroupScheduleState = {
  groupSchedules: {},
  dateSlots: [] as IGroupScheduleDateSlots[]
} as IGroupScheduleState;

// case IGroupScheduleActionTypes.GET_GROUP_SCHEDULE_BY_DATE:
//   action.payload.forEach(slot => {
//     const slotDay = quotedDT(slot.weekStart, slot.startTime);
//     slot.hour = slotDay.hour();
//     slot.minute = slotDay.minute();
//   })
//   state.dateSlots = action.payload;
//   return state;