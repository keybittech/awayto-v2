import { IScheduleContext } from 'awayto';
import { ApiModule, buildUpdate } from '../util/db';

const scheduleContexts: ApiModule = [

  {
    method: 'POST',
    path : 'schedule_contexts',
    cmnd : async (props) => {
      try {

        const { name } = props.event.body as IScheduleContext;

        const response = await props.client.query<IScheduleContext>(`
          INSERT INTO schedule_contexts (name)
          VALUES ($1)
          RETURNING id, name
        `, [name]);
        
        return response.rows[0];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path : 'schedule_contexts',
    cmnd : async (props) => {
      try {
        const { id, name } = props.event.body as IScheduleContext;

        if (!id) throw new Error('Schedule Context ID Missing');

        const updateProps = buildUpdate({ id, name });

        const response = await props.client.query<IScheduleContext>(`
          UPDATE schedule_contexts
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, name
        `, updateProps.array);

        return response.rows[0];
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'schedule_contexts',
    cmnd : async (props) => {
      try {

        const response = await props.client.query<IScheduleContext>(`
          SELECT * FROM enabled_schedule_contexts
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'schedule_contexts/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<IScheduleContext>(`
          SELECT * FROM enabled_schedule_contexts
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
    path : 'schedule_contexts/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<IScheduleContext>(`
          DELETE FROM schedule_contexts
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
    path : 'schedule_contexts/:id/disable',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.client.query(`
          UPDATE schedule_contexts
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

export default scheduleContexts;