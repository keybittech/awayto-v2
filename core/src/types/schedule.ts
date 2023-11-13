import { Void } from '../util';
import { ITimeUnitNames } from './time_unit';
import { IQuote } from './quote';
import { IService } from './service';
import { ApiOptions, EndpointType } from './api';

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
  partType: string;
}

/**
 * @category Schedule
 * @purpose records a potentially available slot on a Group User's Schedule when shown to users during Quote request
 */
export type IScheduleBracketSlot = {
  id: string;
  scheduleBracketId: string;
  startTime: string;
}

/**
 * @category Schedule
 * @purpose allows Group Users to schedule themselves in batches of time across the Schedule instead of one big block of time
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
export const bracketSchema = {
  duration: 1,
  automatic: false,
  multiplier: '1.00'
};

/**
 * @category Schedule
 * @purpose contains the basic properties of a Schedule that may be attached directly to a User or a Group if it is a master schedule
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
export const scheduleSchema = {
  id: '',
  name: '',
  startTime: '',
  endTime: '',
  timezone: '',
  slotDuration: 30,
  scheduleTimeUnitId: '',
  scheduleTimeUnitName: '',
  bracketTimeUnitId: '',
  bracketTimeUnitName: '',
  slotTimeUnitId: '',
  slotTimeUnitName: ''
};

/**
 * @category Schedule
 */
export default {
  postSchedule: {
    kind: EndpointType.MUTATION,
    url: 'schedules',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { name: '' as string, scheduleTimeUnitId: '' as string, bracketTimeUnitId: '' as string, slotTimeUnitId: '' as string, slotDuration: 0 as number, startTime: '' as string, endTime: '' as string, timezone: '' as string },
    resultType: { id: '' as string }
  },
  postScheduleBrackets: {
    kind: EndpointType.MUTATION,
    url: 'schedules/brackets',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { scheduleId: '' as string, brackets: {} as Record<string, IScheduleBracket> },
    resultType: { id: '' as string, brackets: {} as Record<string, IScheduleBracket> }
  },
  putSchedule: {
    kind: EndpointType.MUTATION,
    url: 'schedules',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {} as ISchedule,
    resultType: { id: '' as string }
  },
  getSchedules: {
    kind: EndpointType.QUERY,
    url: 'schedules',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as ISchedule[]
  },
  getScheduleById: {
    kind: EndpointType.QUERY,
    url: 'schedules/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as ISchedule
  },
  deleteSchedule: {
    kind: EndpointType.MUTATION,
    url: 'schedules/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { ids: '' as string },
    resultType: [] as { id: string }[]
  },
  disableSchedule: {
    kind: EndpointType.MUTATION,
    url: 'schedules/:id/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;