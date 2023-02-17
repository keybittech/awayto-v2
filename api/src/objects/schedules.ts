import { ISchedule, IScheduleBracket } from 'awayto';
import { ApiModule, buildUpdate, asyncForEach } from '../util/db';

const schedules: ApiModule = [

  {
    method: 'POST',
    path: 'schedules',
    cmnd: async (props) => {
      try {

        const schedule = props.event.body as ISchedule;
        const { name, brackets, duration, scheduleTimeUnitId, bracketTimeUnitId, slotTimeUnitId, slotDuration } = schedule;

        const { id } = (await props.client.query<ISchedule>(`
          INSERT INTO schedules (name, duration, schedule_time_unit_id, bracket_time_unit_id, slot_time_unit_id, slot_duration)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id
        `, [name, duration, scheduleTimeUnitId, bracketTimeUnitId, slotTimeUnitId, slotDuration])).rows[0];

        schedule.id = id;

        await asyncForEach(brackets, async b => {
          const { id: bracketId } = (await props.client.query<IScheduleBracket>(`
            INSERT INTO schedule_brackets (schedule_id, start_time, duration, multiplier, automatic)
            VALUES ($1, $2, $3)
            RETURNING id
          `, [schedule.id, b.startTime || new Date(), b.duration, b.multiplier, b.automatic])).rows[0];

          b.id = bracketId;

          await asyncForEach(b.services, async s => {
            await props.client.query(`
              INSERT INTO schedule_bracket_services (schedule_bracket_id, service_id)
              VALUES ($1, $2)
              ON CONFLICT (schedule_bracket_id, service_id) DO NOTHING
            `, [bracketId, s.id])
          });
        });

        return [schedule];
      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path: 'schedules',
    cmnd: async (props) => {
      try {
        const { id, name } = props.event.body as ISchedule;

        if (!id) throw new Error('invalid request, no schedule id');

        const updateProps = buildUpdate({ id, name });

        const response = await props.client.query<ISchedule>(`
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
    method: 'GET',
    path: 'schedules',
    cmnd: async (props) => {
      try {

        const response = await props.client.query<ISchedule>(`
          SELECT * FROM dbview_schema.enabled_schedules
        `);

        return response.rows;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path: 'schedules/:id',
    cmnd: async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<ISchedule>(`
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
    method: 'DELETE',
    path: 'schedules/:id',
    cmnd: async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<ISchedule>(`
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
    method: 'PUT',
    path: 'schedules/:id/disable',
    cmnd: async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.client.query(`
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