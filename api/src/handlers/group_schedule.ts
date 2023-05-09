import { ApiHandlers, IGroup, IGroupSchedule, IGroupScheduleDateSlots, ISchedule, IUserProfile, asyncForEach } from 'awayto/core';
import scheduleApiHandler from './schedule';

export default {
  postGroupSchedule: async props => {
    const { groupName } = props.event.pathParameters;

    const { id: groupId } = await props.tx.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    const { sub: groupSub } = await props.tx.one<IUserProfile>(`
      SELECT sub
      FROM dbview_schema.enabled_users
      WHERE username = $1
    `, ['system_group_' + groupName]);

    const newSchedule = await scheduleApiHandler.postSchedule({
      ... props,
      event: {
        ...props.event,
        userSub: groupSub,
        body: { schedule: props.event.body.schedule }
      }
    });

    const groupSchedule = {
      ...newSchedule,
      groupId
    } as IGroupSchedule;

    // Attach schedule to group
    await props.tx.none(`
      INSERT INTO dbtable_schema.group_schedules (group_id, schedule_id, created_sub)
      VALUES ($1, $2, $3::uuid)
      `, [groupId, groupSchedule.id, groupSub]);

    await props.redis.del(`${props.event.userSub}group/${groupName}/schedules`);

    return groupSchedule;
  },
  putGroupSchedule: async props => {
    const { groupName } = props.event.pathParameters;

    const groupSchedule = scheduleApiHandler.putSchedule(props) as Partial<IGroupSchedule>;

    await props.redis.del(`${props.event.userSub}group/${groupName}/schedules`);
    await props.redis.del(`${props.event.userSub}group/${groupName}/schedulemaster/${groupSchedule.id}`);

    return groupSchedule;
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
    const timezone = Buffer.from(props.event.pathParameters.timezone, 'base64').toString();
    const scheduleDateSlots = await props.db.manyOrNone<IGroupScheduleDateSlots>(`
      SELECT * FROM dbfunc_schema.get_group_schedules($1, $2, $3);
    `, [date, scheduleId, timezone]);
    return scheduleDateSlots;
  },
  deleteGroupSchedule: async props => {
    const { groupName, ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');
    const { id: groupId } = await props.tx.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    await asyncForEach(idsSplit, async scheduleId => {
      await props.tx.none(`
        DELETE FROM dbtable_schema.group_schedules
        WHERE group_id = $1 AND schedule_id = $2
      `, [groupId, scheduleId]);
    });

    await props.redis.del(props.event.userSub + `group/${groupName}/schedules`);

    return idsSplit.map(id => ({ id }));
  },
} as Pick<
  ApiHandlers,
  'postGroupSchedule' |
  'putGroupSchedule' |
  'getGroupSchedules' |
  'getGroupScheduleMasterById' |
  'getGroupScheduleByDate' |
  'deleteGroupSchedule'
>;