import { IService, IServiceTier } from 'awayto';
import { asyncForEach } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const services: ApiModule = [

  {
    method: 'POST',
    path : 'services',
    cmnd : async (props) => {
      try {

        const { name, cost, tiers } = props.event.body as IService;

        const service = (await props.db.query<IService>(`
          WITH input_rows(name, cost) as (VALUES ($1, $2::integer)), ins AS (
            INSERT INTO services (name, cost)
            SELECT * FROM input_rows
            ON CONFLICT (name) DO NOTHING
            RETURNING id, name, cost
          )
          SELECT id, name, cost
          FROM ins
          UNION ALL
          SELECT s.id, s.name, s.cost
          FROM input_rows
          JOIN services s USING (name);
        `, [name, cost])).rows[0];

        await asyncForEach(tiers, async t => {
          const serviceTier = (await props.db.query<IServiceTier>(`
            WITH input_rows(name, service_id, multiplier) as (VALUES ($1, $2::uuid, $3::decimal)), ins AS (
              INSERT INTO service_tiers (name, service_id, multiplier)
              SELECT * FROM input_rows
              ON CONFLICT (name, service_id) DO NOTHING
              RETURNING id
            )
            SELECT id
            FROM ins
            UNION ALL
            SELECT st.id
            FROM input_rows
            JOIN service_tiers st USING (name, service_id);
          `, [t.name, service.id, t.multiplier])).rows[0];

          await asyncForEach(t.addons, async a => {
            await props.db.query(`
              INSERT INTO service_tier_addons (service_addon_id, service_tier_id)
              VALUES ($1, $2)
              ON CONFLICT (service_addon_id, service_tier_id) DO NOTHING
            `, [a.id, serviceTier.id]);
          })
        });
        
        return [service];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path : 'services',
    cmnd : async (props) => {
      try {
        const { id, name } = props.event.body as IService;

        if (!id) throw new Error('Service ID Missing');

        const updateProps = buildUpdate({ id, name });

        const response = await props.db.query<IService>(`
          UPDATE services
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
    path : 'services',
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IService>(`
          SELECT * FROM dbview_schema.enabled_services
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'services/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IService>(`
          SELECT * FROM dbview_schema.enabled_services_ext
          WHERE id = $1
        `, [id]);
        
        return response.rows[0];
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'DELETE',
    path : 'services/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IService>(`
          DELETE FROM services
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
    path : 'services/:id/disable',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.db.query(`
          UPDATE services
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

export default services;