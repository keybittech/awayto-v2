import { IServiceAddon } from 'awayto';
import { ApiModule, buildUpdate } from '../util/db';

const serviceAddons: ApiModule = [

  {
    method: 'POST',
    path : 'service_addons',
    cmnd : async (props) => {
      try {

        const { name } = props.event.body as IServiceAddon;

        const response = await props.client.query<IServiceAddon>(`
          WITH input_rows(name) as (VALUES ($1)), ins AS (
            INSERT INTO service_addons (name)
            SELECT * FROM input_rows
            ON CONFLICT (name) DO NOTHING
            RETURNING id, name
          )
          SELECT id, name
          FROM ins
          UNION ALL
          SELECT sa.id, sa.name
          FROM input_rows
          JOIN service_addons sa USING (name);
        `, [name]);
        
        return response.rows;

      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path : 'service_addons',
    cmnd : async (props) => {
      try {
        const { id, name } = props.event.body as IServiceAddon;

        if (!id) throw new Error('Service Addon ID Missing');

        const updateProps = buildUpdate({ id, name });

        const response = await props.client.query<IServiceAddon>(`
          UPDATE service_addons
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
    path : 'service_addons',
    cmnd : async (props) => {
      try {

        const response = await props.client.query<IServiceAddon>(`
          SELECT * FROM dbview_schema.enabled_service_addons
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'service_addons/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<IServiceAddon>(`
          SELECT * FROM dbview_schema.enabled_service_addons
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
    path : 'service_addons/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<IServiceAddon>(`
          DELETE FROM service_addons
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
    path : 'service_addons/:id/disable',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.client.query(`
          UPDATE service_addons
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

export default serviceAddons;