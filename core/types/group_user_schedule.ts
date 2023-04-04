

import { Merge } from '../util';
import { ISchedule } from './schedule';
import { IService } from './service';

declare global {
  interface IMergedState extends Merge<IGroupUserScheduleState> { }
}


/**
 * @category Group User Schedule
 */
export type IGroupUserScheduleStubReplacement = {
  username: string;
  slotDate: string;
  startTime: string;
  scheduleBracketSlotId: string;
  serviceTierId: string;
}

/**
 * @category Group User Schedule
 */
export type IGroupUserScheduleStub = {
  groupScheduleId: string;
  userScheduleId: string;
  quoteId: string;
  slotDate: string;
  startTime: string;
  serviceName: string;
  tierName: string;
  replacement: IGroupUserScheduleStubReplacement;
}

/**
 * @category Group User Schedule
 */
export type IGroupUserSchedule = ISchedule & {
  id: string;
  groupScheduleId: string;
  userScheduleId: string;
  services: Record<string, IService>;
}

/**
 * @category Group User Schedule
 */
export type IGroupUserScheduleState = IGroupUserScheduleStub & IGroupUserSchedule & {
  groupUserSchedules: Record<string, IGroupUserSchedule>;
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
  GET_GROUP_USER_SCHEDULE_STUB_REPLACEMENT = "GET/group/:groupName/schedules/user/:userScheduleId/stubreplacement",
  PUT_GROUP_USER_SCHEDULE_STUB_REPLACEMENT = "PUT/group/:groupName/schedules/user/:userScheduleId/stubreplacement",
  GET_GROUP_USER_SCHEDULE_BY_ID = "GET/group/:groupName/schedules/:groupScheduleId/user/:userScheduleId",
  DELETE_GROUP_USER_SCHEDULE_BY_USER_SCHEDULE_ID = "DELETE/group/:groupName/schedules/user/:ids"
}

const initialGroupUserScheduleState = {
  groupUserSchedules: {},
  stubs: [] as IGroupUserScheduleStub[]
} as IGroupUserScheduleState;

// case IGroupUserScheduleActionTypes.POST_GROUP_USER_SCHEDULE:
//   case IGroupUserScheduleActionTypes.PUT_GROUP_USER_SCHEDULE:
//   case IGroupUserScheduleActionTypes.GET_GROUP_USER_SCHEDULES:
//     // state.groupUserSchedules = new Map([ ...state.groupUserSchedules ]
//     //   .concat( action.payload.map(gus => {
//     //     gus.brackets = new Map(Object.entries(gus.brackets || {}) as Iterable<readonly [string, IScheduleBracket]>);
//     //     gus.services = new Map();
//     //     for (const bracket of gus.brackets.values()) {
//     //       bracket.services = new Map(Object.entries(bracket.services || {}) as Iterable<readonly [string, IService]>)
//     //       bracket.slots = new Map(Object.entries(bracket.slots || {}) as Iterable<readonly [string, IScheduleBracketSlot]>)

//     //       for (const service of bracket.services.values()) {
//     //         gus.services.set(service.id, service);
//     //       }
//     //     }
        
//     //     return  [gus.id, gus];
//     //   }) as readonly [string, IGroupUserSchedule][] ));