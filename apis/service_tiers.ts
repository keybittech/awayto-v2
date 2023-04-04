import { IServiceTier, IServiceTierActionTypes, utcNowString } from 'awayto/core';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const service_tiers: ApiModule = [

  {
    action: IServiceTierActionTypes.POST_SERVICE_TIER,
    cmnd : async (props) => {
      try {

        const { name, serviceId, multiplier } = props.event.body;

        const response = await props.db.query<IServiceTier>(`
          INSERT INTO dbtable_schema.service_tiers (name, serviceId, multiplier, created_sub)
          VALUES ($1, $2, $3, $4::uuid)
          RETURNING id
        `, [name, serviceId, multiplier, props.event.userSub]);
        
        return response.rows[0];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IServiceTierActionTypes.PUT_SERVICE_TIER,
    cmnd : async (props) => {
      try {
        const { id, name, multiplier } = props.event.body;

        if (!id) throw new Error('Service ID or Service Tier ID Missing');

        const updateProps = buildUpdate({
          id,
          name,
          multiplier,
          updated_sub: props.event.userSub,
          updated_on: utcNowString()
        });

        const response = await props.db.query<IServiceTier>(`
          UPDATE dbtable_schema.service_tiers
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id
        `, updateProps.array);

        return response.rows[0];
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IServiceTierActionTypes.GET_SERVICE_TIERS,
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IServiceTier>(`
          SELECT * FROM dbview_schema.enabled_service_tiers
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IServiceTierActionTypes.GET_SERVICE_TIER_BY_ID,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IServiceTier>(`
          SELECT * FROM dbview_schema.enabled_service_tiers_ext
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IServiceTierActionTypes.DELETE_SERVICE_TIER,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IServiceTier>(`
          DELETE FROM dbtable_schema.service_tiers
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IServiceTierActionTypes.DISABLE_SERVICE_TIER,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.db.query(`
          UPDATE dbtable_schema.service_tiers
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

export default service_tiers;