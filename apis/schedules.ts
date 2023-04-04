import { DbError, ISchedule, IScheduleActionTypes, IScheduleBracket, ScheduledParts, utcNowString } from 'awayto/core';
import { asyncForEach, ApiModule, ApiProps, buildUpdate } from 'awayto/core';

async function removeScheduleBrackets(scheduleId: string, props: ApiProps): Promise<void> {

  const { rows: parts } = await props.db.query<ScheduledParts>(`
    SELECT * FROM dbfunc_schema.get_scheduled_parts($1);
  `, [scheduleId]);

  const scheduledSlots = parts.find(p => p.ids?.length && 'slot' === p.type);
  const scheduledServices = parts.find(p => p.ids?.length && 'service' === p.type);

  const { rows: [{ ids }] } = await props.db.query<{ ids: string[] }>(`
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
          await props.db.query(`
            DELETE FROM dbtable_schema.schedule_bracket_slots
            WHERE schedule_bracket_id = $1 AND id <> ALL($2::uuid[])
          `, [bracketId, scheduledSlots.ids]);

          // Disable record so we can catch all disabled records later
          await props.db.query(`
            UPDATE dbtable_schema.schedule_bracket_slots
            SET enabled = false
            WHERE schedule_bracket_id = $1 AND id = ANY($2::uuid[])
          `, [bracketId, scheduledSlots.ids]);
        }

        // Delete and disable this old bracket's unused and used services
        if (scheduledServices) {
          await props.db.query(`
            DELETE FROM dbtable_schema.schedule_bracket_services
            WHERE schedule_bracket_id = $1 AND id <> ALL($2::uuid[])
          `, [bracketId, scheduledServices.ids]);

          // Disable record so we can catch all disabled records later
          await props.db.query(`
            UPDATE dbtable_schema.schedule_bracket_services
            SET enabled = false
            WHERE schedule_bracket_id = $1 AND id = ANY($2::uuid[])
          `, [bracketId, scheduledServices.ids]);
        }

        // Delete and disable brackets with unused and used slots or services
        await props.db.query(`
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
        await props.db.query(`
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
        await props.db.query(`
          DELETE FROM dbtable_schema.schedule_brackets
          WHERE id = $1
        `, [bracketId]);
      }
    }
  }
}

const schedules: ApiModule = [

  {
    action: IScheduleActionTypes.POST_SCHEDULE,
    cmnd: async (props) => {
      try {

        const schedule = props.event.body;

        const { name, scheduleTimeUnitId, bracketTimeUnitId, slotTimeUnitId, slotDuration, startTime, endTime, timezone } = schedule;

        const { rows: [{ id }] } = await props.db.query<ISchedule>(`
          INSERT INTO dbtable_schema.schedules (name, created_sub, slot_duration, schedule_time_unit_id, bracket_time_unit_id, slot_time_unit_id, start_time, end_time, timezone)
          VALUES ($1, $2::uuid, $3::integer, $4::uuid, $5::uuid, $6::uuid, $7, $8, $9)
          RETURNING id, name, created_on as "createdOn"
        `, [name, props.event.userSub, slotDuration, scheduleTimeUnitId, bracketTimeUnitId, slotTimeUnitId, startTime || null, endTime || null, timezone]);

        schedule.id = id;

        return [schedule];
      } catch (error) {
        const { constraint } = error as DbError;

        if ('unique_enabled_name_created_sub' === constraint) {
          throw { reason: 'You cannot create duplicate schedules. Please edit or remove the existing one.' }
        }

        throw error;
      }
    }
  },

  // Posting new brackets completely wipes out old brackets, and inserts new ones.
  // If any quotes or bookings are already attached to a bracket, creating a dependency,
  // the slots and services tied to those quotes or bookings will be set to disabled, hiding
  // them from various UIs; all other records are deleted. For any future quotes or bookings, 
  // they will be handled as orphaned records by the admin on a separate UI
  {
    action: IScheduleActionTypes.POST_SCEHDULE_BRACKETS,
    cmnd: async (props) => {
      try {
        const { scheduleId, brackets } = props.event.body;

        // Handle old brackets
        await removeScheduleBrackets(scheduleId, props);

        // For all new incomimg brackets, create all resources
        for (const bracketTempId in brackets) {
          const b = brackets[bracketTempId];
          const { rows: [{ id: bracketId }] } = await props.db.query<IScheduleBracket>(`
            INSERT INTO dbtable_schema.schedule_brackets (schedule_id, duration, multiplier, automatic, created_sub)
            VALUES ($1, $2, $3, $4, $5::uuid)
            RETURNING id
          `, [scheduleId, b.duration, b.multiplier, b.automatic, props.event.userSub]);

          b.id = bracketId;
          
          for (const servId in b.services) {
            await props.db.query(`
              INSERT INTO dbtable_schema.schedule_bracket_services (schedule_bracket_id, service_id, created_sub)
              VALUES ($1, $2, $3::uuid)
            `, [bracketId, servId, props.event.userSub])
          }

          for (const slotTemporaryId in b.slots) {
            const slot = b.slots[slotTemporaryId];
            const [{ id: slotId }] = (await props.db.query(`
              INSERT INTO dbtable_schema.schedule_bracket_slots (schedule_bracket_id, start_time, created_sub)
              VALUES ($1, $2::interval, $3::uuid)
              RETURNING id
            `, [bracketId, slot.startTime, props.event.userSub])).rows;

            slot.id = slotId;
            slot.scheduleBracketId = bracketId;
          }
        }

        await props.redis.del(props.event.userSub + `profile/details`);
        await props.redis.del(props.event.userSub + 'schedules/' + scheduleId);

        return { id: scheduleId, brackets };

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IScheduleActionTypes.PUT_SCHEDULE,
    cmnd: async (props) => {
      try {
        const { id, startTime, endTime } = props.event.body;

        if (!id) throw new Error('invalid request, no schedule id');

        const updateProps = buildUpdate({
          id,
          start_time: startTime || null,
          end_time: endTime || null,
          updated_sub: props.event.userSub,
          updated_on: utcNowString()
        });

        const response = await props.db.query<ISchedule>(`
          UPDATE dbtable_schema.schedules
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, name
        `, updateProps.array);

        return response.rows;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IScheduleActionTypes.GET_SCHEDULES,
    cmnd: async (props) => {
      try {

        const response = await props.db.query<ISchedule>(`
          SELECT * FROM dbview_schema.enabled_schedules
          WHERE "createdSub" = $1
        `, [props.event.userSub]);

        return response.rows;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IScheduleActionTypes.GET_SCHEDULE_BY_ID,
    cmnd: async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<ISchedule>(`
          SELECT * FROM dbview_schema.enabled_schedules_ext
          WHERE id = $1
        `, [id]);

        return response.rows;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IScheduleActionTypes.DELETE_SCHEDULE,
    cmnd: async (props) => {
      try {
        const { ids } = props.event.pathParameters;
        const idsSplit = ids.split(',');

        await asyncForEach(idsSplit, async scheduleId => {

          // Handle old brackets
          await removeScheduleBrackets(scheduleId, props);

          await props.db.query(`
            UPDATE dbtable_schema.schedules
            SET enabled = false
            WHERE id = $1
          `, [scheduleId]);

          await props.db.query(`
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

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IScheduleActionTypes.DISABLE_SCHEDULE,
    cmnd: async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.db.query(`
          UPDATE dbtable_schema.schedules
          SET enabled = false, updated_on = $2, updated_sub = $3
          WHERE id = $1
        `, [id, utcNowString(), props.event.userSub]);

        return { id };

      } catch (error) {
        throw error;
      }

    }
  }

]

export default schedules;