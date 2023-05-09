import dayjs from 'dayjs';
import { ApiOptions, EndpointType } from './api';
import { ISchedule } from './schedule';

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
  groupName: string;
};

/**
 * @category Group Schedule
 */
export default {
  postGroupSchedule: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/schedules',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, schedule: {} as ISchedule },
    resultType: {} as IGroupSchedule
  },
  putGroupSchedule: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/schedules',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {} as IGroupSchedule,
    resultType: {} as IGroupSchedule
  },
  getGroupSchedules: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/schedules',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string },
    resultType: [] as IGroupSchedule[]
  },
  getGroupScheduleMasterById: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/schedules/master/:scheduleId',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, scheduleId: '' as string },
    resultType: {} as ISchedule
  },
  getGroupScheduleByDate: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/schedules/:scheduleId/datetz/:date/:timezone',
    method: 'GET',
    opts: { cache: 'skip' } as ApiOptions,
    queryArg: { groupName: '' as string, scheduleId: '' as string, date: '' as string, timezone: '' as string },
    resultType: [] as IGroupScheduleDateSlots[]
  },
  deleteGroupSchedule: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/schedules/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, ids: '' as string },
    resultType: [] as { id: string }[]
  },
} as const;