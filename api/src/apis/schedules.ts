import { ISchedule, IScheduleActionTypes, IScheduleBracket } from 'awayto';
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
          INSERT INTO dbtable_schema.schedules (name, duration, schedule_time_unit_id, bracket_time_unit_id, slot_time_unit_id, slot_duration)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [name, duration, scheduleTimeUnitId, bracketTimeUnitId, slotTimeUnitId, slotDuration]);

        schedule.id = id;

        return [schedule];
      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IScheduleActionTypes.POST_SCEHDULE_BRACKETS,
    cmnd: async (props) => {
      const { brackets } = props.event.body;
      const newBrackets = {} as Record<string, IScheduleBracket>;

      await asyncForEach(Object.values(brackets), async b => {
        const { id: bracketId } = (await props.db.query<IScheduleBracket>(`
          INSERT INTO dbtable_schema.schedule_brackets (schedule_id, duration, multiplier, automatic)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [b.scheduleId, b.duration, b.multiplier, b.automatic])).rows[0];

        b.id = bracketId;

        await asyncForEach(Object.values(b.services), async s => {
          await props.db.query(`
            INSERT INTO dbtable_schema.schedule_bracket_services (schedule_bracket_id, service_id)
            VALUES ($1, $2)
            ON CONFLICT (schedule_bracket_id, service_id) DO NOTHING
          `, [bracketId, s.id])
        });

        await asyncForEach(Object.values(b.slots), async s => {
          const [{ id: slotId }] = (await props.db.query(`
            INSERT INTO dbtable_schema.schedule_bracket_slots (schedule_bracket_id, start_time, created_sub)
            VALUES ($1, $2, $3)
            ON CONFLICT (schedule_bracket_id, start_time) DO NOTHING
            RETURNING id
          `, [bracketId, moment(s.startTime).utc().toString(), props.event.userSub])).rows;

          s.id = slotId;
        });

        newBrackets[b.id] = b;
      });

      return brackets;
    }
  },

  {
    action: IScheduleActionTypes.PUT_SCHEDULE,
    cmnd: async (props) => {
      try {
        const { id, name } = props.event.body;

        if (!id) throw new Error('invalid request, no schedule id');

        const updateProps = buildUpdate({ id, name });

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
        `);

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
          SET enabled = false
          WHERE id = $1
        `, [id]);

        return { id };

      } catch (error) {
        throw error;
      }

    }
  }

]

export default schedules;