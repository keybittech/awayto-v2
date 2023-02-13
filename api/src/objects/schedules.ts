import { ISchedule, IScheduleBracket, IScheduleContext, IScheduleTerm } from 'awayto';
import { ApiModule, buildUpdate, asyncForEach } from '../util/db';

const schedules: ApiModule = [

  {
    method: 'POST',
    path: 'schedules',
    cmnd: async (props) => {
      try {

        const { name, overbook, term, brackets, services } = props.event.body as ISchedule;

        const schedule = (await props.client.query<ISchedule>(`
          INSERT INTO schedules (name, overbook)
          VALUES ($1, $2)
          RETURNING id, name, overbook
        `, [name, overbook])).rows[0];

        const dbTerm = (await props.client.query<IScheduleTerm>(`
          INSERT INTO schedule_terms (schedule_id, schedule_context_id, duration)
          VALUES ($1, $2, $3)
          RETURNING id, schedule_id as "scheduleId", schedule_context_id as "scheduleContextId", duration
        `, [schedule.id, term.scheduleContextId, term.duration])).rows[0];

        const { name: termContextName } = (await props.client.query<IScheduleContext>(`
          SELECT name FROM schedule_contexts
          WHERE id = $1
        `, [term.scheduleContextId])).rows[0];

        dbTerm.scheduleContextName = termContextName;

        schedule.term = dbTerm;

        const dbBrackets = [] as IScheduleBracket[];

        await asyncForEach(brackets, async b => {
          const dbBracket = (await props.client.query<IScheduleBracket>(`
            INSERT INTO schedule_brackets (schedule_id, schedule_context_id, bracket, multiplier)
            VALUES ($1, $2, $3, $4)
            RETURNING id, schedule_id as "scheduleId", schedule_context_id as "scheduleContextId", bracket, multiplier
          `, [schedule.id, b.scheduleContextId, b.bracket, b.multiplier])).rows[0];

          const { name: scheduleContextName } = (await props.client.query<IScheduleContext>(`
            SELECT name FROM schedule_contexts
            WHERE id = $1
          `, [b.scheduleContextId])).rows[0];

          dbBracket.scheduleContextName = scheduleContextName;

          dbBrackets.push(dbBracket);
        });

        schedule.brackets = dbBrackets;

        await asyncForEach(services, async s => {
          await props.client.query(`
            INSERT INTO schedule_services (schedule_id, service_id)
            VALUES ($1, $2)
            ON CONFLICT (schedule_id, service_id) DO NOTHING
          `, [schedule.id, s.id])
        })

        schedule.services = services;

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