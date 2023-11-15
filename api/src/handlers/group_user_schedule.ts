import { IGroupUserSchedule, IGroupUserScheduleStub, ScheduledParts, buildUpdate, utcNowString, asyncForEach, createHandlers } from 'awayto/core';

export default createHandlers({
  postGroupUserSchedule: async props => {
    const { groupScheduleId, userScheduleId } = props.event.body;

    await props.tx.none(`
      INSERT INTO dbtable_schema.group_user_schedules (group_schedule_id, user_schedule_id, created_sub)
      VALUES ($1::uuid, $2::uuid, $3::uuid)
      ON CONFLICT (group_schedule_id, user_schedule_id) DO NOTHING
    `, [groupScheduleId, userScheduleId, props.event.userSub]);

    await props.redis.del(`${props.event.userSub}group/user_schedules`);

    return [];
  },
  getGroupUserSchedules: async props => {
    const { groupScheduleId } = props.event.pathParameters;

    const groupUserSchedules = await props.db.manyOrNone<IGroupUserSchedule>(`
      SELECT egus.*
      FROM dbview_schema.enabled_group_user_schedules_ext egus
      WHERE egus."groupScheduleId" = $1
    `, [groupScheduleId]);

    return groupUserSchedules;
  },
  getGroupUserScheduleStubs: async props => {
    const groupUserScheduleStubs = await props.db.manyOrNone<IGroupUserScheduleStub>(`
      SELECT guss.*, gus.group_schedule_id as "groupScheduleId"
      FROM dbview_schema.group_user_schedule_stubs guss
      JOIN dbtable_schema.group_user_schedules gus ON gus.user_schedule_id = guss."userScheduleId"
      JOIN dbtable_schema.schedules schedule ON schedule.id = gus.group_schedule_id
      JOIN dbview_schema.enabled_users eu ON eu.sub = schedule.created_sub
      JOIN dbtable_schema.users u ON u.id = eu.id
      WHERE u.username = $1
    `, ['system_group_' + props.event.group.id]);

    return groupUserScheduleStubs;
  },
  getGroupUserScheduleStubReplacement: async props => {
    const { userScheduleId, slotDate, startTime, tierName } = props.event.pathParameters;

    const stubs = await props.db.manyOrNone<IGroupUserScheduleStub>(`
      SELECT replacement FROM dbfunc_schema.get_peer_schedule_replacement($1::UUID[], $2::DATE, $3::INTERVAL, $4::TEXT)
    `, [[userScheduleId], slotDate, startTime, tierName]);

    return stubs;
  },
  putGroupUserScheduleStubReplacement: async props => {
    const { quoteId, slotDate, scheduleBracketSlotId, serviceTierId } = props.event.body;

    const updateProps = buildUpdate({
      id: quoteId,
      slot_date: slotDate,
      schedule_bracket_slot_id: scheduleBracketSlotId,
      service_tier_id: serviceTierId,
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });

    await props.tx.none(`
      UPDATE dbtable_schema.quotes
      SET ${updateProps.string}
      WHERE id = $1
    `, updateProps.array);

    return { success: true };
  },
  deleteGroupUserScheduleByUserScheduleId: async props => {
    const { ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');

    await asyncForEach(idsSplit, async userScheduleId => {
      const parts = await props.tx.manyOrNone<ScheduledParts>(`
        SELECT * FROM dbfunc_schema.get_scheduled_parts($1);
      `, [userScheduleId]);

      const hasParts = parts.some(p => p.ids?.length);

      if (!hasParts) {
        await props.tx.none(`
          DELETE FROM dbtable_schema.group_user_schedules
          WHERE user_schedule_id = $1
        `, [userScheduleId]);
      } else {
        await props.tx.none(`
          UPDATE dbtable_schema.group_user_schedules
          SET enabled = false
          WHERE user_schedule_id = $1
        `, [userScheduleId]);
      }
    });

    await props.redis.del(`${props.event.userSub}group/user_schedules`);

    return idsSplit.map(id => ({ id }));
  }
});