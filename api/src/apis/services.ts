import moment from 'moment';

import { DbError, IService, IServiceActionTypes, IServiceTier, asyncForEach } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const services: ApiModule = [

  {
    action: IServiceActionTypes.POST_SERVICE,
    cmnd : async (props) => {
      try {

        const { name, cost, tiers } = props.event.body;

        const { rows: [service] } = await props.db.query<IService>(`
          INSERT INTO dbtable_schema.services (name, cost, created_sub)
          VALUES ($1, $2::integer, $3::uuid)
          RETURNING id, name, cost, created_on
        `, [name, cost, props.event.userSub]);

        await asyncForEach(Object.values(tiers).sort((a, b) => a.order - b.order), async t => {
          const serviceTier = (await props.db.query<IServiceTier>(`
            WITH input_rows(name, service_id, multiplier, created_sub) as (VALUES ($1, $2::uuid, $3::decimal, $4::uuid)), ins AS (
              INSERT INTO dbtable_schema.service_tiers (name, service_id, multiplier, created_sub)
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
          `, [t.name, service.id, t.multiplier, props.event.userSub])).rows[0];

          await asyncForEach(Object.values(t.addons).sort((a, b) => a.order - b.order), async a => {
            await props.db.query(`
              INSERT INTO dbtable_schema.service_tier_addons (service_addon_id, service_tier_id, created_sub)
              VALUES ($1, $2, $3::uuid)
              ON CONFLICT (service_addon_id, service_tier_id) DO NOTHING
            `, [a.id, serviceTier.id, props.event.userSub]);
          })
        });
        
        return [service];

      } catch (error) {
        const { constraint } = error as DbError;

        if ('services_name_created_sub_key' === constraint) {
          throw { reason: 'You already have a service with the same name.' }
        }

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

        const updateProps = buildUpdate({
          id,
          name,
          updated_sub: props.event.userSub,
          updated_on: moment().utc()
        });

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
            UPDATE dbtable_schema.services
            SET enabled = false, updated_on = $2, updated_sub = $3
            WHERE id = $1
          `, [id, moment().utc(), props.event.userSub]);

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