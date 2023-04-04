import { IServiceAddon, IServiceAddonActionTypes, utcNowString } from 'awayto/core';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const serviceAddons: ApiModule = [

  {
    action: IServiceAddonActionTypes.POST_SERVICE_ADDON,
    cmnd : async (props) => {
      try {

        const { name } = props.event.body;

        const response = await props.db.query<IServiceAddon>(`
          WITH input_rows(name, created_sub) as (VALUES ($1, $2::uuid)), ins AS (
            INSERT INTO dbtable_schema.service_addons (name, created_sub)
            SELECT * FROM input_rows
            ON CONFLICT (name) DO NOTHING
            RETURNING id, name
          )
          SELECT id, name
          FROM ins
          UNION ALL
          SELECT sa.id, sa.name
          FROM input_rows
          JOIN dbtable_schema.service_addons sa USING (name);
        `, [name, props.event.userSub]);
        
        return response.rows;

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IServiceAddonActionTypes.PUT_SERVICE_ADDON,
    cmnd : async (props) => {
      try {
        const { id, name } = props.event.body;

        if (!id) throw new Error('Service Addon ID Missing');

        const updateProps = buildUpdate({
          id,
          name,
          updated_sub: props.event.userSub,
          updated_on: utcNowString()
        });

        const response = await props.db.query<IServiceAddon>(`
          UPDATE dbtable_schema.service_addons
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
    action: IServiceAddonActionTypes.GET_SERVICE_ADDONS,
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IServiceAddon>(`
          SELECT * FROM dbview_schema.enabled_service_addons
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IServiceAddonActionTypes.GET_SERVICE_ADDON_BY_ID,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IServiceAddon>(`
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
    action: IServiceAddonActionTypes.DELETE_SERVICE_ADDON,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IServiceAddon>(`
          DELETE FROM dbtable_schema.service_addons
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
    action: IServiceAddonActionTypes.DISABLE_SERVICE_ADDON,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.db.query(`
          UPDATE dbtable_schema.service_addons
          SET enabled = false, updated_on = $2, updated_sub = $3
          WHERE id = $1
        `, [id, utcNowString(), props.event.userSub]);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  }

]

export default serviceAddons;