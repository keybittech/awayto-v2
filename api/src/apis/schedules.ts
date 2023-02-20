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

        const schedule = props.event.body as ISchedule;
        const { name, brackets, duration, scheduleTimeUnitId, bracketTimeUnitId, slotTimeUnitId, slotDuration } = schedule;

        const { id } = (await props.db.query<ISchedule>(`
          INSERT INTO schedules (name, duration, schedule_time_unit_id, bracket_time_unit_id, slot_time_unit_id, slot_duration)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [name, duration, scheduleTimeUnitId, bracketTimeUnitId, slotTimeUnitId, slotDuration])).rows[0];

        schedule.id = id;

        await asyncForEach(brackets, async b => {
          const { id: bracketId } = (await props.db.query<IScheduleBracket>(`
            INSERT INTO schedule_brackets (schedule_id, duration, multiplier, automatic)
            VALUES ($1, $2, $3, $4)
            RETURNING id
          `, [schedule.id, b.duration, b.multiplier, b.automatic])).rows[0];

          b.id = bracketId;

          await asyncForEach(b.services, async s => {
            await props.db.query(`
              INSERT INTO schedule_bracket_services (schedule_bracket_id, service_id)
              VALUES ($1, $2)
              ON CONFLICT (schedule_bracket_id, service_id) DO NOTHING
            `, [bracketId, s.id])
          });

          await asyncForEach(b.slots, async s => {
            const [{ id: slotId }] = (await props.db.query(`
              INSERT INTO schedule_bracket_slots (schedule_bracket_id, start_time, created_sub)
              VALUES ($1, $2, $3)
              ON CONFLICT (schedule_bracket_id, start_time) DO NOTHING
              RETURNING id
            `, [bracketId, moment(s.startTime, "ddd HH:mm A").utc().toString(), props.event.userSub])).rows;

            s.id = slotId;
          });
        });

        return [schedule];
      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IScheduleActionTypes.PUT_SCHEDULE,
    cmnd: async (props) => {
      try {
        const { id, name } = props.event.body as ISchedule;

        if (!id) throw new Error('invalid request, no schedule id');

        const updateProps = buildUpdate({ id, name });

        const response = await props.db.query<ISchedule>(`
          UPDATE schedules
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
          DELETE FROM schedules
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
          UPDATE schedules
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