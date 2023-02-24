import { DbError, ISchedule, IScheduleActionTypes, IScheduleBracket } from 'awayto';
import { asyncForEach } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';
import moment from 'moment';

const schedules: ApiModule = [

  {
    action: IScheduleActionTypes.POST_SCHEDULE,
    cmnd: async (props) => {
      try {

        const schedule = props.event.body;
        
        const { name, duration, scheduleTimeUnitId, bracketTimeUnitId, slotTimeUnitId, slotDuration } = schedule;

        const { rows: [{ id }] } = await props.db.query<ISchedule>(`
          WITH input_rows(name, created_sub, duration, slot_duration, schedule_time_unit_id, bracket_time_unit_id, slot_time_unit_id) as (VALUES ($1, $2::uuid, $3::integer, $4::integer, $5::uuid, $6::uuid, $7::uuid)), ins AS (
            INSERT INTO dbtable_schema.schedules (name, created_sub, duration, slot_duration, schedule_time_unit_id, bracket_time_unit_id, slot_time_unit_id)
            SELECT * FROM input_rows
            ON CONFLICT (name, created_sub) DO NOTHING
            RETURNING id, name
          )
          SELECT id, name
          FROM ins
          UNION ALL
          SELECT s.id, s.name
          FROM input_rows
          JOIN dbtable_schema.schedules s USING (name)
        `, [name, props.event.userSub, duration, slotDuration, scheduleTimeUnitId, bracketTimeUnitId, slotTimeUnitId]);

        schedule.id = id;

        return [schedule];
      } catch (error) {
        const { constraint } = error as DbError;

        if ('schedules_name_created_sub_key' === constraint) {
          throw { reason: 'You cannot create duplicate schedules. Please edit or remove the existing one.' }
        }

        throw error;
      }
    }
  },
  {
    action: IScheduleActionTypes.POST_SCHEDULE_PARENT,
    cmnd: async (props) => {
      const { parentUuid, scheduleId } = props.event.body;

      await props.db.query(`
        INSERT INTO dbtable_schema.uuid_schedules (parent_uuid, schedule_id, created_sub)
        VALUES ($1, $2, $3::uuid)
        ON CONFLICT (parent_uuid, schedule_id) DO NOTHING
      `, [parentUuid, scheduleId, props.event.userSub])

      return true;
    }
  },

  {
    action: IScheduleActionTypes.POST_SCEHDULE_BRACKETS,
    cmnd: async (props) => {
      try {
        const { scheduleId, brackets } = props.event.body;
        const newBrackets = {} as Record<string, IScheduleBracket>;

        await props.db.query(`
          DELETE FROM dbtable_schema.schedule_brackets
          WHERE schedule_id = $1 AND created_sub = $2
        `, [scheduleId, props.event.userSub]);
  
        await asyncForEach(Object.values(brackets), async b => {
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
  
          await asyncForEach(Object.values(b.services), async s => {
            await props.db.query(`
              INSERT INTO dbtable_schema.schedule_bracket_services (schedule_bracket_id, service_id, created_sub)
              VALUES ($1, $2, $3::uuid)
              ON CONFLICT (schedule_bracket_id, service_id) DO NOTHING
            `, [bracketId, s.id, props.event.userSub])
          });
  
          await asyncForEach(Object.values(b.slots), async s => {
            const [{ id: slotId }] = (await props.db.query(`
              INSERT INTO dbtable_schema.schedule_bracket_slots (schedule_bracket_id, start_time, created_sub)
              VALUES ($1, $2, $3::uuid)
              ON CONFLICT (schedule_bracket_id, start_time) DO NOTHING
              RETURNING id
            `, [bracketId, moment(s.startTime).utc().toString(), props.event.userSub])).rows;
  
            s.id = slotId;
          });
  
          newBrackets[b.id] = b;
        });

        await props.redis.del(props.event.userSub + 'schedules/' + scheduleId);
  
        return brackets;
        
      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IScheduleActionTypes.PUT_SCHEDULE,
    cmnd: async (props) => {
      try {
        const { id, name } = props.event.body;

        if (!id) throw new Error('invalid request, no schedule id');

        const updateProps = buildUpdate({
          id,
          name,
          updated_sub: props.event.userSub,
          updated_on: moment().utc()
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
        const { id } = props.event.pathParameters;

        const response = await props.db.query<ISchedule>(`
          DELETE FROM dbtable_schema.schedules
          WHERE id = $1
          RETURNING id
        `, [id]);

        return response.rows;

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
        `, [id, moment().utc(), props.event.userSub]);

        return { id };

      } catch (error) {
        throw error;
      }

    }
  }

]

export default schedules;