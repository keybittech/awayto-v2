
import { asyncForEach, Extend } from '../util';
import { ApiHandler, buildUpdate, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { ISchedule, ScheduledParts } from './schedule';
import { IService } from './service';
import { utcNowString } from './time_unit';

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
  groupName: string;
}

/**
 * @category Group User Schedule
 */
const groupUserSchedulesApi = {
  postGroupUserSchedule: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/user_schedules',
    method: 'POST',
    cache: true,
    queryArg: { groupName: '' as string, groupScheduleId: '' as string, userScheduleId: '' as string },
    resultType: [] as any[]
  },
  getGroupUserSchedules: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/user_schedules/:groupScheduleId',
    method: 'GET',
    cache: true,
    queryArg: { groupName: '' as string, groupScheduleId: '' as string },
    resultType: [] as IGroupUserSchedule[]
  },
  getGroupUserScheduleStubs: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/user_schedules/stubs',
    method: 'GET',
    cache: 'skip',
    queryArg: { groupName: '' as string },
    resultType: { stubs: [] as IGroupUserScheduleStub[] }
  },
  getGroupUserScheduleStubReplacement: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/user_schedules/stub_replacement/:userScheduleId',
    method: 'GET',
    cache: true,
    queryArg: { groupName: '' as string, userScheduleId: '' as string, slotDate: '' as string, startTime: '' as string, tierName: '' as string },
    resultType: { stubs: [] as IGroupUserScheduleStub[] }
  },
  putGroupUserScheduleStubReplacement: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/user_schedules/stub_replacement',
    method: 'PUT',
    cache: true,
    queryArg: { groupName: '' as string, quoteId: '' as string, slotDate: '' as string, scheduleBracketSlotId: '' as string, serviceTierId: '' as string },
    resultType: true as boolean
  },
  deleteGroupUserScheduleByUserScheduleId: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/user_schedules/:ids',
    method: 'DELETE',
    cache: true,
    queryArg: { groupName: '' as string, ids: '' as string },
    resultType: [] as { id: string }[]
  },
} as const;

/**
 * @category Group User Schedule
 */
const groupUserSchedulesApiHandlers: ApiHandler<typeof groupUserSchedulesApi> = {
  postGroupUserSchedule: async (props) => {
    const { groupName, groupScheduleId, userScheduleId } = props.event.pathParameters;

    await props.db.none(`
      INSERT INTO dbtable_schema.group_user_schedules (group_schedule_id, user_schedule_id, created_sub)
      VALUES ($1::uuid, $2::uuid, $3::uuid)
      ON CONFLICT (group_schedule_id, user_schedule_id) DO NOTHING
    `, [groupScheduleId, userScheduleId, props.event.userSub]);

    await props.redis.del(`${props.event.userSub}group/${groupName}/schedules/${groupScheduleId}/user`);

    return [];
  },
  getGroupUserSchedules: async (props) => {
    const { groupScheduleId } = props.event.pathParameters;

    const groupUserSchedules = await props.db.manyOrNone<IGroupUserSchedule>(`
      SELECT egus.*
      FROM dbview_schema.enabled_group_user_schedules_ext egus
      WHERE egus."groupScheduleId" = $1
    `, [groupScheduleId]);

    return groupUserSchedules;
  },
  getGroupUserScheduleStubs: async (props) => {
    const { groupName } = props.event.pathParameters;

    const groupUserScheduleStubs = await props.db.manyOrNone<IGroupUserScheduleStub>(`
      SELECT guss.*, gus.group_schedule_id as "groupScheduleId"
      FROM dbview_schema.group_user_schedule_stubs guss
      JOIN dbtable_schema.group_user_schedules gus ON gus.user_schedule_id = guss."userScheduleId"
      JOIN dbtable_schema.schedules schedule ON schedule.id = gus.group_schedule_id
      JOIN dbview_schema.enabled_users eu ON eu.sub = schedule.created_sub
      WHERE eu.username = $1
    `, ['system_group_' + groupName]);

    return { stubs: groupUserScheduleStubs };
  },
  getGroupUserScheduleStubReplacement: async (props) => {
    const { userScheduleId } = props.event.pathParameters;
    const { slotDate, startTime, tierName } = props.event.queryParameters;

    const stubs = await props.db.manyOrNone<IGroupUserScheduleStub>(`
      SELECT replacement FROM dbfunc_schema.get_peer_schedule_replacement($1::UUID[], $2::DATE, $3::INTERVAL, $4::TEXT)
    `, [[userScheduleId], slotDate, startTime, tierName]);

    return { stubs };
  },
  putGroupUserScheduleStubReplacement: async (props) => {
    const { quoteId, slotDate, scheduleBracketSlotId, serviceTierId } = props.event.body;

    const updateProps = buildUpdate({
      id: quoteId,
      slot_date: slotDate,
      schedule_bracket_slot_id: scheduleBracketSlotId,
      service_tier_id: serviceTierId,
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });

    await props.db.query(`
      UPDATE dbtable_schema.quotes
      SET ${updateProps.string}
      WHERE id = $1
    `, updateProps.array);

    return true;
  },
  deleteGroupUserScheduleByUserScheduleId: async (props) => {
    const { groupName, ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');

    await asyncForEach(idsSplit, async userScheduleId => {
      const parts = await props.db.manyOrNone<ScheduledParts>(`
        SELECT * FROM dbfunc_schema.get_scheduled_parts($1);
      `, [userScheduleId]);

      const hasParts = parts.some(p => p.ids?.length);

      if (!hasParts) {
        await props.db.none(`
          DELETE FROM dbtable_schema.group_user_schedules
          WHERE user_schedule_id = $1
          RETURNING id
        `, [userScheduleId]);
      } else {
        await props.db.none(`
          UPDATE dbtable_schema.group_user_schedules
          SET enabled = false
          WHERE user_schedule_id = $1
          RETURNING id
        `, [userScheduleId]);
      }
    });

    await props.redis.del(props.event.userSub + `group/${groupName}/schedules`);

    return idsSplit.map(id => ({ id }));
  }
} as const;

/**
 * @category Group User Schedule
 */
type GroupServicesApi = typeof groupUserSchedulesApi;

/**
 * @category Group User Schedule
 */
type GroupServicesApiHandler = typeof groupUserSchedulesApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<GroupServicesApi> { }
  interface SiteApiHandlerRef extends Extend<GroupServicesApiHandler> { }
}

Object.assign(siteApiRef, groupUserSchedulesApi);
Object.assign(siteApiHandlerRef, groupUserSchedulesApiHandlers);