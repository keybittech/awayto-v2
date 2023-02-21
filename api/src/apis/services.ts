import { IService, IServiceActionTypes, IServiceTier } from 'awayto';
import { asyncForEach } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const services: ApiModule = [

  {
    action: IServiceActionTypes.POST_SERVICE,
    cmnd : async (props) => {
      try {

        const { name, cost, tiers } = props.event.body;

        const { rows: [service] } = await props.db.query<IService>(`
          WITH input_rows(name, cost) as (VALUES ($1, $2::integer)), ins AS (
            INSERT INTO dbtable_schema.services (name, cost)
            SELECT * FROM input_rows
            ON CONFLICT (name) DO NOTHING
            RETURNING id, name, cost, created_on
          )
          SELECT id, name, cost, created_on
          FROM ins
          UNION ALL
          SELECT s.id, s.name, s.cost, s.created_on
          FROM input_rows
          JOIN dbtable_schema.services s USING (name);
        `, [name, cost]);

        await asyncForEach(Object.values(tiers).sort((a, b) => a.order - b.order), async t => {
          const serviceTier = (await props.db.query<IServiceTier>(`
            WITH input_rows(name, service_id, multiplier) as (VALUES ($1, $2::uuid, $3::decimal)), ins AS (
              INSERT INTO dbtable_schema.service_tiers (name, service_id, multiplier)
              SELECT * FROM input_rows
              ON CONFLICT (name, service_id) DO NOTHING
              RETURNING id
            )
            SELECT id
            FROM ins
            UNION ALL
            SELECT st.id
            FROM input_rows
            JOIN dbtable_schema.service_tiers st USING (name, service_id);
          `, [t.name, service.id, t.multiplier])).rows[0];

          await asyncForEach(Object.values(t.addons).sort((a, b) => a.order - b.order), async a => {
            await props.db.query(`
              INSERT INTO dbtable_schema.service_tier_addons (service_addon_id, service_tier_id)
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
    action: IServiceActionTypes.PUT_SERVICE,
    cmnd : async (props) => {
      try {
        const { id, name } = props.event.body;

        if (!id) throw new Error('Service ID Missing');

        const updateProps = buildUpdate({ id, name });

        const response = await props.db.query<IService>(`
          UPDATE dbtable_schema.services
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
    action: IServiceActionTypes.GET_SERVICES,
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
    action: IServiceActionTypes.GET_SERVICE_BY_ID,
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
    action: IServiceActionTypes.DELETE_SERVICE,
    cmnd : async (props) => {
      try {
        const { ids } = props.event.pathParameters;
        const idSplit = ids.split(',');

        await asyncForEach(idSplit, async id => {
          await props.db.query(`
            DELETE FROM dbtable_schema.services
            WHERE id = $1
            RETURNING id
          `, [id]);

          await props.redis.del(props.event.userSub + 'services/' + id);
        });

        await props.redis.del(props.event.userSub + 'services');

        return idSplit.map(id => ({id}));
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IServiceActionTypes.DISABLE_SERVICE,
    cmnd : async (props) => {
      try {
        const { ids } = props.event.pathParameters;
        const idSplit = ids.split(',');

        await asyncForEach(idSplit, async id => {
          await props.db.query(`
            UPDATE services
            SET enabled = false
            WHERE id = $1
          `, [id]);

          await props.redis.del(props.event.userSub + 'services/' + id);
        });

        await props.redis.del(props.event.userSub + 'services');

        return idSplit.map(id => ({id}));        
      } catch (error) {
        throw error;
      }

    }
  }

]

export default services;