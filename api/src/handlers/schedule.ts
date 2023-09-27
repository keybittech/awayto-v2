import { ApiProps, ISchedule, IScheduleBracket, ScheduledParts, buildUpdate, utcNowString, AnyRecord, asyncForEach, createHandlers, DbError } from 'awayto/core';

export default createHandlers({
  postSchedule: async props => {
    try {
      const { name, scheduleTimeUnitId, bracketTimeUnitId, slotTimeUnitId, slotDuration, startTime, endTime, timezone } = props.event.body;

      const { id } = await props.tx.one<ISchedule>(`
        INSERT INTO dbtable_schema.schedules (name, created_sub, slot_duration, schedule_time_unit_id, bracket_time_unit_id, slot_time_unit_id, start_time, end_time, timezone)
        VALUES ($1, $2::uuid, $3::integer, $4::uuid, $5::uuid, $6::uuid, $7, $8, $9)
        RETURNING id, name, created_on as "createdOn"
      `, [name, props.event.userSub, slotDuration, scheduleTimeUnitId, bracketTimeUnitId, slotTimeUnitId, startTime || null, endTime || null, timezone]);

      return { id };
          
    } catch (error) {
      const { constraint } = error as DbError;
      
      if ('unique_enabled_name_created_sub' === constraint) {
        throw { reason: 'You can only join a master schedule once. Instead, edit that schedule, then add another bracket to it.' }
      }

      throw error;
    }
  },
  postScheduleBrackets: async props => {
    const { scheduleId, brackets } = props.event.body;

    if (Object.values(brackets).some(b => !Object.keys(b.services).length)) {
      throw { reason: 'All brackets must have a service attached. If you continue having this error, notify an admin and then please start over.' }
    }

    // Handle old brackets
    await removeScheduleBrackets(scheduleId, props);

    // For all new incoming brackets, create all resources
    for (const bracketTempId in brackets) {
      const b = brackets[bracketTempId];
      const { id: bracketId } = await props.tx.one<IScheduleBracket>(`
        INSERT INTO dbtable_schema.schedule_brackets (schedule_id, duration, multiplier, automatic, created_sub)
        VALUES ($1, $2, $3, $4, $5::uuid)
        RETURNING id
      `, [scheduleId, b.duration, b.multiplier, b.automatic, props.event.userSub]);

      b.id = bracketId;

      for (const servRef in b.services) {
        const serv = b.services[servRef];
        await props.tx.none(`
          INSERT INTO dbtable_schema.schedule_bracket_services (schedule_bracket_id, service_id, created_sub)
          VALUES ($1, $2, $3::uuid)
        `, [bracketId, serv.id, props.event.userSub]);
      }

      for (const slotTemporaryId in b.slots) {
        const slot = b.slots[slotTemporaryId];
        const { id: slotId } = await props.tx.one(`
          INSERT INTO dbtable_schema.schedule_bracket_slots (schedule_bracket_id, start_time, created_sub)
          VALUES ($1, $2::interval, $3::uuid)
          RETURNING id
        `, [bracketId, slot.startTime, props.event.userSub]);

        slot.id = slotId;
        slot.scheduleBracketId = bracketId;
      }
    }

    await props.redis.del(props.event.userSub + `profile/details`);
    await props.redis.del(props.event.userSub + 'schedules/' + scheduleId);

    return { id: scheduleId, brackets };
  },
  putSchedule: async props => {
    const { id, name, startTime, endTime } = props.event.body;

    const updateProps = buildUpdate({
      id,
      name,
      start_time: startTime || null,
      end_time: endTime || null,
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });

    const schedule = await props.tx.one<ISchedule>(`
      UPDATE dbtable_schema.schedules
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id, name
    `, updateProps.array);

    return { id };
  },
  getSchedules: async props => {
    const schedules = await props.db.manyOrNone<ISchedule>(`
      SELECT es.* 
      FROM dbview_schema.enabled_schedules es
      JOIN dbtable_schema.schedules s ON s.id = es.id
      WHERE s.created_sub = $1
    `, [props.event.userSub]);

    return schedules;
  },
  getScheduleById: async props => {
    const { id } = props.event.pathParameters;

    const schedule = await props.db.one<ISchedule>(`
      SELECT * FROM dbview_schema.enabled_schedules_ext
      WHERE id = $1
    `, [id]);

    return schedule;
  },

  deleteSchedule: async props => {
    const { ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');

    await asyncForEach(idsSplit, async scheduleId => {
      // Handle old brackets
      await removeScheduleBrackets(scheduleId, props);

      await props.tx.none(`
        UPDATE dbtable_schema.schedules
        SET enabled = false
        WHERE id = $1
      `, [scheduleId]);

      await props.tx.none(`
        DELETE FROM dbtable_schema.schedules
        WHERE dbtable_schema.schedules.id = $1
        AND NOT EXISTS (
          SELECT 1
          FROM dbtable_schema.schedule_brackets bracket
          WHERE bracket.schedule_id = dbtable_schema.schedules.id
        )
      `, [scheduleId]);
    });

    await props.redis.del(props.event.userSub + `schedules`);
    await props.redis.del(props.event.userSub + `profile/details`);

    return idsSplit.map(id => ({ id }));
  },

  disableSchedule: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      UPDATE dbtable_schema.schedules
      SET enabled = false, updated_on = $2, updated_sub = $3
      WHERE id = $1
    `, [id, utcNowString(), props.event.userSub]);

    return { id };
  }
});

async function removeScheduleBrackets<Q extends AnyRecord>(scheduleId: string, props: ApiProps<Q>): Promise<void> {

  const parts = await props.tx.manyOrNone<ScheduledParts>(`
    SELECT * FROM dbfunc_schema.get_scheduled_parts($1);
  `, [scheduleId]);

  const scheduledSlots = parts.find(p => p.ids?.length && 'slot' === p.type);
  const scheduledServices = parts.find(p => p.ids?.length && 'service' === p.type);

  const { ids }= await props.tx.one<{ ids: string[] }>(`
    SELECT JSONB_AGG(id) as ids FROM dbtable_schema.schedule_brackets
    WHERE schedule_id = $1
  `, [scheduleId]);

  // If there are existing brackets for this user schedule
  if (ids) {

    // Loop through old bracket ids
    for (const bracketId of ids) {

      // If any slots or services are tied to existing quotes or bookings
      if (scheduledSlots?.ids?.length || scheduledServices?.ids?.length) {

        // Delete and disable this old bracket's unused and used slots
        if (scheduledSlots) {
          await props.tx.none(`
            DELETE FROM dbtable_schema.schedule_bracket_slots
            WHERE schedule_bracket_id = $1 AND id <> ALL($2::uuid[])
          `, [bracketId, scheduledSlots.ids]);

          // Disable record so we can catch all disabled records later
          await props.tx.none(`
            UPDATE dbtable_schema.schedule_bracket_slots
            SET enabled = false
            WHERE schedule_bracket_id = $1 AND id = ANY($2::uuid[])
          `, [bracketId, scheduledSlots.ids]);
        }

        // Delete and disable this old bracket's unused and used services
        if (scheduledServices) {
          await props.tx.none(`
            DELETE FROM dbtable_schema.schedule_bracket_services
            WHERE schedule_bracket_id = $1 AND id <> ALL($2::uuid[])
          `, [bracketId, scheduledServices.ids]);

          // Disable record so we can catch all disabled records later
          await props.tx.none(`
            UPDATE dbtable_schema.schedule_bracket_services
            SET enabled = false
            WHERE schedule_bracket_id = $1 AND id = ANY($2::uuid[])
          `, [bracketId, scheduledServices.ids]);
        }

        // Delete and disable brackets with unused and used slots or services
        await props.tx.none(`
          DELETE FROM dbtable_schema.schedule_brackets
          USING dbtable_schema.schedule_bracket_slots slot,
                dbtable_schema.schedule_bracket_services service
          WHERE dbtable_schema.schedule_brackets.id = $1
          AND dbtable_schema.schedule_brackets.id = slot.schedule_bracket_id
          AND slot.schedule_bracket_id = service.schedule_bracket_id
          AND slot.id <> ALL($2::uuid[])
          AND service.id <> ALL($3::uuid[])
        `, [bracketId, (scheduledSlots?.ids || []), (scheduledServices?.ids || [])]);

        // Disable record so we can catch all disabled records later
        await props.tx.none(`
          UPDATE dbtable_schema.schedule_brackets
          SET enabled = false
          FROM dbtable_schema.schedule_bracket_slots slot
          JOIN dbtable_schema.schedule_bracket_services service ON service.schedule_bracket_id = slot.schedule_bracket_id
          WHERE dbtable_schema.schedule_brackets.id = $1
          AND slot.schedule_bracket_id = dbtable_schema.schedule_brackets.id
          AND (slot.id = ANY($2::uuid[])
          OR service.id = ANY($3::uuid[]))
        `, [bracketId, (scheduledSlots?.ids || []), (scheduledServices?.ids || [])]);
      } else {
        // If there were no slots or services attached to this bracket, delete it completely
        await props.tx.none(`
          DELETE FROM dbtable_schema.schedule_brackets
          WHERE id = $1
        `, [bracketId]);
      }
    }
  }
}