import { ISchedule, IScheduleBracket, IScheduleContext } from 'awayto';
import { ApiModule, buildUpdate, asyncForEach } from '../util/db';

const schedules: ApiModule = [

  {
    method: 'POST',
    path: 'schedules',
    cmnd: async (props) => {
      try {

        const { name, brackets, scheduleContextId, duration } = props.event.body as ISchedule;

        const schedule = (await props.client.query<ISchedule>(`
          INSERT INTO schedules (name, schedule_context_id, duration)
          VALUES ($1, $2, $3)
          RETURNING id, name, schedule_context_id as "scheduleContextId", duration
        `, [name, scheduleContextId, duration])).rows[0];

        const { name: scheduleContextName } = (await props.client.query<IScheduleContext>(`
          SELECT name FROM schedule_contexts
          WHERE id = $1
        `, [scheduleContextId])).rows[0];

        schedule.scheduleContextName = scheduleContextName;

        const scheduleBrackets = [] as IScheduleBracket[];

        await asyncForEach(brackets, async b => {
          const scheduleBracket = (await props.client.query<IScheduleBracket>(`
            INSERT INTO schedule_brackets (schedule_id, schedule_context_id, bracket_duration, multiplier, automatic)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, schedule_id as "scheduleId", schedule_context_id as "scheduleContextId", "bracketDuration", multiplier, automatic
          `, [schedule.id, b.scheduleContextId, b.bracketDuration, b.multiplier, b.automatic])).rows[0];


          await asyncForEach(b.services, async s => {
            await props.client.query(`
              INSERT INTO schedule_bracket_services (schedule_bracket_id, service_id)
              VALUES ($1, $2)
              ON CONFLICT (schedule_bracket_id, service_id) DO NOTHING
            `, [scheduleBracket.id, s.id])
          })

          const { name: scheduleContextName } = (await props.client.query<IScheduleContext>(`
            SELECT name FROM schedule_contexts
            WHERE id = $1
          `, [b.scheduleContextId])).rows[0];

          scheduleBracket.scheduleContextName = scheduleContextName;

          scheduleBrackets.push(scheduleBracket);
        });

        schedule.brackets = scheduleBrackets;


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