

import dayjs from 'dayjs';
import { asyncForEach, Extend } from '../util';
import { ApiHandler, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { IGroup } from './group';
import { IUserProfile } from './profile';
import { ISchedule } from './schedule';

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
  scheduleId: string;
  groupName: string;
};

/**
 * @category Group Schedule
 */
const groupSchedulesApi = {
  postGroupSchedule: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/schedules',
    method: 'POST',
    cache: true,
    queryArg: { groupName: '' as string },
    resultType: {} as IGroupSchedule
  },
  putGroupSchedule: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/schedules',
    method: 'PUT',
    cache: true,
    queryArg: { groupName: '' as string },
    resultType: {} as IGroupSchedule
  },
  getGroupSchedules: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/schedules',
    method: 'GET',
    cache: true,
    queryArg: { groupName: '' as string },
    resultType: [] as IGroupSchedule[]
  },
  getGroupScheduleMasterById: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/schedules/master/:scheduleId',
    method: 'GET',
    cache: true,
    queryArg: { groupName: '' as string, scheduleId: '' as string },
    resultType: {} as ISchedule
  },
  getGroupScheduleByDate: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/schedules/:scheduleId/:date',
    method: 'GET',
    cache: false,
    queryArg: { groupName: '' as string, scheduleId: '' as string, date: '' as string, timezone: '' as string },
    resultType: [] as IGroupScheduleDateSlots[]
  },
  deleteGroupSchedule: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/schedules/:ids',
    method: 'DELETE',
    cache: true,
    queryArg: { groupName: '' as string, ids: '' as string },
    resultType: [] as { id: string }[]
  },
} as const;

/**
 * @category Group Schedule
 */
const groupSchedulesApiHandlers: ApiHandler<typeof groupSchedulesApi> = {
  postGroupSchedule: async props => {
    const { groupName } = props.event.pathParameters;

    const { id: groupId } = await props.db.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    const { sub: groupSub } = await props.db.one<IUserProfile>(`
      SELECT sub
      FROM dbview_schema.enabled_users
      WHERE username = $1
    `, ['system_group_' + groupName]);

    const postSchedule = schedules.find(api => api.action === IScheduleActionTypes.POST_SCHEDULE);

    const [schedule] = await postSchedule?.cmnd({
      event: {
        ...props.event,
        userSub: groupSub,
        body: props.event.body
      },
      db: props.db,
      redis: props.redis
    }) as [IGroupSchedule];

    schedule.groupId = groupId;

    // Attach schedule to group
    await props.db.query(`
      INSERT INTO dbtable_schema.group_schedules (group_id, schedule_id, created_sub)
      VALUES ($1, $2, $3::uuid)
      ON CONFLICT (group_id, schedule_id) DO NOTHING
      RETURNING id
      `, [groupId, schedule.id, groupSub]);

    await props.redis.del(`${props.event.userSub}group/${groupName}/schedules`);

    return [schedule];
  },
  putGroupSchedule: async props => {
    const { groupName } = props.event.pathParameters;


    const postSchedule = schedules.find(api => api.action === IScheduleActionTypes.PUT_SCHEDULE);

    const [schedule] = await postSchedule?.cmnd({
      event: {
        ...props.event,
        body: props.event.body
      },
      db: props.db,
      redis: props.redis
    }) as [IGroupSchedule];

    await props.redis.del(`${props.event.userSub}group/${groupName}/schedules`);
    await props.redis.del(`${props.event.userSub}group/${groupName}/schedulemaster/${schedule.id}`);

    return [schedule];
  },
  getGroupSchedules: async props => {
    const { groupName } = props.event.pathParameters;
    const { id: groupId } = await props.db.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName])

    const groups = await props.db.manyOrNone<IGroupSchedule>(`
      SELECT es.*, eus."groupId"
      FROM dbview_schema.enabled_group_schedules eus
      LEFT JOIN dbview_schema.enabled_schedules es ON es.id = eus."scheduleId"
      WHERE eus."groupId" = $1
    `, [groupId]);

    return groups;
  },
  getGroupScheduleMasterById: async props => {
    const { groupName, scheduleId } = props.event.pathParameters;
    const schedules = await props.db.one<ISchedule>(`
      SELECT ese.*
      FROM dbview_schema.enabled_schedules_ext ese
      JOIN dbview_schema.enabled_users eu ON eu.sub = ese."createdSub"
      WHERE ese.id = $1 AND eu.username = $2
    `, [scheduleId, 'system_group_' + groupName]);

    return schedules;
  },
  getGroupScheduleByDate: async props => {
    const { scheduleId, date } = props.event.pathParameters;
    const timezone = Buffer.from(props.event.pathParameters.timezone, 'base64');
    const scheduleDateSlots = await props.db.manyOrNone<IGroupScheduleDateSlots>(`
      SELECT * FROM dbfunc_schema.get_group_schedules($1, $2, $3);
    `, [date, scheduleId, timezone]);
    return scheduleDateSlots;
  },
  deleteGroupSchedule: async props => {
    const { groupName, ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');
    const { id: groupId } = await props.db.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    await asyncForEach(idsSplit, async scheduleId => {
      await props.db.none(`
        DELETE FROM dbtable_schema.group_schedules
        WHERE group_id = $1 AND schedule_id = $2
        RETURNING id
      `, [groupId, scheduleId]);
    });

    await props.redis.del(props.event.userSub + `group/${groupName}/schedules`);

    return idsSplit.map(id => ({ id }));
  },
} as const;

/**
 * @category Group Schedule
 */
type GroupSchedulesApi = typeof groupSchedulesApi;

/**
 * @category Group Schedule
 */
type GroupSchedulesApiHandler = typeof groupSchedulesApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<GroupSchedulesApi> { }
  interface SiteApiHandlerRef extends Extend<GroupSchedulesApiHandler> { }
}

Object.assign(siteApiRef, groupSchedulesApi);
Object.assign(siteApiHandlerRef, groupSchedulesApiHandlers);