import { IServiceTier, IServiceTierActionTypes } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const service_tiers: ApiModule = [

  {
    action: IServiceTierActionTypes.POST_SERVICE_TIER,
    cmnd : async (props) => {
      try {

        const { name, serviceId, multiplier } = props.event.body;

        const response = await props.db.query<IServiceTier>(`
          INSERT INTO dbtable_schema.service_tiers (name, serviceId, multiplier)
          VALUES ($1, $2, $3)
          RETURNING id, name, serviceId, multiplier
        `, [name, serviceId, multiplier]);
        
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

        const updateProps = buildUpdate({ id, name, multiplier });

        const response = await props.db.query<IServiceTier>(`
          UPDATE dbtable_schema.service_tiers
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, name, serviceId, multiplier
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

export default service_tiers;