import { ApiOptions, EndpointType } from './api';
import { ISchedule } from './schedule';
import { IService } from './service';

/**
 * @category Group User Schedule
 * @purpose contains information about a potential replacement for a Booking which has been abandoned
 */
export type IGroupUserScheduleStubReplacement = {
  username: string;
  slotDate: string;
  startTime: string;
  scheduleBracketSlotId: string;
  serviceTierId: string;
  groupName: string;
  quoteId: string;
}

/**
 * @category Group User Schedule
 * @purpose contains reference information for Schedule Bookings which have been abandoned
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
 * @purpose extends a Schedule to include details about the Group it is attached to
 */
export type IGroupUserSchedule = ISchedule & {
  id: string;
  groupScheduleId: string;
  userScheduleId: string;
  services: Record<string, IService>;
  groupName: string;
}

/**
 * @category Group User Schedule
 */
export default {
  postGroupUserSchedule: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/user_schedules',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, groupScheduleId: '' as string, userScheduleId: '' as string },
    resultType: [] as IGroupUserSchedule[]
  },
  getGroupUserSchedules: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/user_schedules/:groupScheduleId',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, groupScheduleId: '' as string },
    resultType: [] as IGroupUserSchedule[]
  },
  getGroupUserScheduleStubs: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/user_schedules_stubs',
    method: 'GET',
    opts: { cache: 'skip' } as ApiOptions,
    queryArg: { groupName: '' as string },
    resultType: [] as IGroupUserScheduleStub[]
  },
  getGroupUserScheduleStubReplacement: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/user_schedules/stub_replacement/:userScheduleId/sd/:slotDate/st/:startTime/tn/:tierName',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, userScheduleId: '' as string, slotDate: '' as string, startTime: '' as string, tierName: '' as string },
    resultType: [] as IGroupUserScheduleStub[]
  },
  putGroupUserScheduleStubReplacement: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/user_schedules/stub_replacement',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, quoteId: '' as string, scheduleBracketSlotId: '' as string, serviceTierId: '' as string, slotDate: '' as string, startTime: '' as string, userScheduleId: '' as string },
    resultType: { success: true as boolean }
  },
  deleteGroupUserScheduleByUserScheduleId: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/user_schedules/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, ids: '' as string },
    resultType: [] as { id: string }[]
  },
} as const;