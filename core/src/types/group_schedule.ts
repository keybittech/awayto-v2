import dayjs from 'dayjs';
import { ApiOptions, EndpointType } from './api';
import { ISchedule } from './schedule';
import { Void } from '../util';

/**
 * @category Group Schedule
 * @purpose contains the properties of a single instance of a reservable appointment slot on the Schedule
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
 * @purpose extends a Schedule to include properties of the Group it is attached to
 */
export type IGroupSchedule = ISchedule & {
  master: true;
  groupId: string;
  scheduleId: string;
};

/**
 * @category Group Schedule
 */
export default {
  postGroupSchedule: {
    kind: EndpointType.MUTATION,
    url: 'group/schedules',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { schedule: {} as ISchedule },
    resultType: { id: '' as string }
  },
  putGroupSchedule: {
    kind: EndpointType.MUTATION,
    url: 'group/schedules',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { schedule: {} as IGroupSchedule },
    resultType: { success: true as boolean }
  },
  getGroupSchedules: {
    kind: EndpointType.QUERY,
    url: 'group/schedules',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IGroupSchedule[]
  },
  getGroupScheduleMasterById: {
    kind: EndpointType.QUERY,
    url: 'group/schedules/master/:scheduleId',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { scheduleId: '' as string },
    resultType: {} as IGroupSchedule
  },
  getGroupScheduleByDate: {
    kind: EndpointType.QUERY,
    url: 'group/schedules/:scheduleId/datetz/:date/:timezone',
    method: 'GET',
    opts: { cache: 'skip' } as ApiOptions,
    queryArg: { scheduleId: '' as string, date: '' as string, timezone: '' as string },
    resultType: [] as IGroupScheduleDateSlots[]
  },
  deleteGroupSchedule: {
    kind: EndpointType.MUTATION,
    url: 'group/schedules/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { ids: '' as string },
    resultType: [] as { id: string }[]
  },
} as const;