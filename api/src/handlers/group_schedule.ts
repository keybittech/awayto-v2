import { IGroupSchedule, IGroupScheduleDateSlots, IUserProfile, asyncForEach, createHandlers, decodeVal, withEvent } from 'awayto/core';
import scheduleApiHandler from './schedule';

export default createHandlers({
  postGroupSchedule: async props => {
    const { userSub } = props.event;
    const groupUser = 'system_group_' + props.event.group.id;

    const { sub: groupSub } = await props.tx.one<IUserProfile>(`
      SELECT sub
      FROM dbtable_schema.users
      WHERE username = $1
    `, [groupUser]);

    props.event.userSub = groupSub;

    const postedSchedule = await scheduleApiHandler.postSchedule(withEvent(props, props.event.body.schedule))

    // Attach schedule to group
    await props.tx.none(`
      INSERT INTO dbtable_schema.group_schedules (group_id, schedule_id, created_sub)
      VALUES ($1, $2, $3::uuid)
    `, [props.event.group.id, postedSchedule.id, groupSub]);

    await props.redis.del(`${userSub}group/schedules`);

    return { id: postedSchedule.id };
  },
  putGroupSchedule: async props => {
    const { userSub } = props.event;
    const groupUser = 'system_group_' + props.event.group.id;

    const { sub: groupSub } = await props.tx.one<IUserProfile>(`
      SELECT sub
      FROM dbtable_schema.users
      WHERE username = $1
    `, [groupUser]);

    props.event.userSub = groupSub;

    await scheduleApiHandler.putSchedule(withEvent(props, props.event.body.schedule)) as Partial<IGroupSchedule>;

    await props.redis.del(`${userSub}group/schedules`);
    await props.redis.del(`${userSub}group/schedules/master/${props.event.body.schedule.id}`);

    return { success: true };
  },
  getGroupSchedules: async props => {
    const groups = await props.db.manyOrNone<IGroupSchedule>(`
      SELECT es.*, eus."groupId"
      FROM dbview_schema.enabled_group_schedules eus
      LEFT JOIN dbview_schema.enabled_schedules es ON es.id = eus."scheduleId"
      WHERE eus."groupId" = $1
    `, [props.event.group.id]);

    return groups;
  },
  getGroupScheduleMasterById: async props => {
    const { scheduleId } = props.event.pathParameters;
    const schedules = await props.db.one<IGroupSchedule>(`
      SELECT ese.*
      FROM dbview_schema.enabled_schedules_ext ese
      JOIN dbtable_schema.schedules s ON s.id = ese.id
      JOIN dbtable_schema.users u ON u.sub = s.created_sub
      WHERE ese.id = $1 AND u.username = $2
    `, [scheduleId, 'system_group_' + props.event.group.id]);

    return schedules;
  },
  getGroupScheduleByDate: async props => {
    const { scheduleId, date } = props.event.pathParameters;
    const timezone = decodeVal(props.event.pathParameters.timezone);
    const scheduleDateSlots = await props.db.manyOrNone<IGroupScheduleDateSlots>(`
      SELECT * FROM dbfunc_schema.get_group_schedules($1, $2, $3);
    `, [date, scheduleId, timezone]);
    return scheduleDateSlots;
  },
  deleteGroupSchedule: async props => {
    const { ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');

    await asyncForEach(idsSplit, async scheduleId => {
      await props.tx.none(`
        DELETE FROM dbtable_schema.group_schedules
        WHERE group_id = $1 AND schedule_id = $2
      `, [props.event.group.id, scheduleId]);
    });

    await props.redis.del(props.event.userSub + `group/schedules`);

    return idsSplit.map(id => ({ id }));
  },
});