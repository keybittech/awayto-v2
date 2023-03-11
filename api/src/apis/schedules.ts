import { DbError, ISchedule, IScheduleActionTypes, IScheduleBracket, IScheduleBracketSlot, IService, utcNowString } from 'awayto';
import { asyncForEach } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

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

  {
    action: IScheduleActionTypes.POST_SCEHDULE_BRACKETS,
    cmnd: async (props) => {
      try {
        const { scheduleId } = props.event.body;

        const brackets = new Map<string, IScheduleBracket>(Object.entries(props.event.body.brackets));

        await props.db.query(`
          DELETE FROM dbtable_schema.schedule_brackets
          WHERE schedule_id = $1 AND created_sub = $2
        `, [scheduleId, props.event.userSub]);

        for (const b of brackets.values()) {
          const { id: bracketId } = (await props.db.query<IScheduleBracket>(`
            INSERT INTO dbtable_schema.schedule_brackets (schedule_id, duration, multiplier, automatic, created_sub)
            VALUES ($1, $2, $3, $4, $5::uuid)
            RETURNING id
          `, [scheduleId, b.duration, b.multiplier, b.automatic, props.event.userSub])).rows[0];

          if (isNaN(parseInt(b.id))) {
            await props.db.query(`
              DELETE FROM dbtable_schema.schedule_bracket_services
              WHERE schedule_bracket_id = $1 AND created_sub = $2
            `, [b.id, props.event.userSub]);

            await props.db.query(`
              DELETE FROM dbtable_schema.schedule_bracket_slots
              WHERE schedule_bracket_id = $1 AND created_sub = $2
            `, [b.id, props.event.userSub]);
          }

          b.id = bracketId;

          const services = new Map<string, IService>(Object.entries(b.services));

          for (const serv of services.values()) {
            await props.db.query(`
              INSERT INTO dbtable_schema.schedule_bracket_services (schedule_bracket_id, service_id, created_sub)
              VALUES ($1, $2, $3::uuid)
            `, [bracketId, serv.id, props.event.userSub])
          }

          const slots = new Map<string, IScheduleBracketSlot>(Object.entries(b.slots));

          for (const slot of slots.values()) {
            const [{ id: slotId }] = (await props.db.query(`
              INSERT INTO dbtable_schema.schedule_bracket_slots (schedule_bracket_id, start_time, created_sub)
              VALUES ($1, $2::interval, $3::uuid)
              RETURNING id
            `, [bracketId, slot.startTime, props.event.userSub])).rows;

            slot.id = slotId;
            slot.scheduleBracketId = bracketId;
          }
        }

        await props.redis.del(props.event.userSub + 'schedules/' + scheduleId);

        return { id: scheduleId, brackets: Array.from(brackets.values()) };

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
          WHERE id = $1 AND "createdSub" = $2
        `, [id, props.event.userSub]);

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

          let { rows: [{ brackets }] } = await props.db.query<ISchedule>(`
            SELECT * FROM dbview_schema.enabled_schedules_ext
            WHERE id = $1
          `, [scheduleId]);

          brackets = new Map(Object.entries(brackets || {}) as Iterable<readonly [string, IScheduleBracket]>);

          for (const b of brackets.values()) {
            // Delete slots that aren't attached to a booking or quote
            await props.db.query<{ enabled: boolean[] }>(`
              DELETE FROM dbtable_schema.schedule_bracket_slots slot
              WHERE slot.schedule_bracket_id = $1
              AND NOT EXISTS (
                SELECT 1
                FROM dbtable_schema.bookings booking
                WHERE booking.schedule_bracket_slot_id = slot.id
              )
              AND NOT EXISTS (
                SELECT 1
                FROM dbtable_schema.quotes quote
                WHERE quote.schedule_bracket_slot_id = slot.id
              )
            `, [b.id]);

            // Delete any bracket services which also aren't related to bookings
            await props.db.query(`
              DELETE FROM dbtable_schema.schedule_bracket_services service
              WHERE service.schedule_bracket_id = $1
              AND NOT EXISTS (
                SELECT 1
                FROM dbtable_schema.schedule_bracket_slots slot
                WHERE slot.schedule_bracket_id = service.schedule_bracket_id
              )
            `, [b.id]);

            await props.db.query(`
              DELETE FROM dbtable_schema.schedule_brackets bracket
              WHERE bracket.id = $1
              AND NOT EXISTS (
                SELECT 1
                FROM dbtable_schema.schedule_bracket_slots slot
                JOIN dbtable_schema.schedule_brackets brack ON bracket.id = slot.schedule_bracket_id
                WHERE brack.id = bracket.id
              )
            `, [b.id]);
          }

          await props.db.query(`
            UPDATE dbtable_schema.quotes
            SET enabled = false, updated_on = $2, updated_sub = $3
            FROM dbtable_schema.schedule_bracket_slots slot
            JOIN dbtable_schema.schedule_brackets bracket ON bracket.id = slot.schedule_bracket_id
            JOIN dbtable_schema.schedules schedule ON schedule.id = bracket.schedule_id
            WHERE slot.id = dbtable_schema.quotes.schedule_bracket_slot_id AND schedule.id = $1
          `, [scheduleId, utcNowString(), props.event.userSub]);

          await props.db.query(`
            UPDATE dbtable_schema.schedules
            SET enabled = false
            WHERE id = $1
          `, [scheduleId]);

          await props.db.query(`
            DELETE FROM dbtable_schema.schedules schedule
            WHERE schedule.id = $1
            AND NOT EXISTS (
              SELECT 1
              FROM dbtable_schema.schedule_brackets bracket
              JOIN dbtable_schema.schedules sched ON sched.id = bracket.schedule_id
              WHERE sched.id = schedule.id
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