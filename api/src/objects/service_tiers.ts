import { IServiceTier } from 'awayto';
import { ApiModule, buildUpdate } from '../util/db';

const service_tiers: ApiModule = [

  {
    method: 'POST',
    path : 'service_tiers',
    cmnd : async (props) => {
      try {

        const { name, serviceId, multiplier } = props.event.body as IServiceTier;

        const response = await props.client.query<IServiceTier>(`
          INSERT INTO service_tiers (name, serviceId, multiplier)
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
    method: 'PUT',
    path : 'service_tiers',
    cmnd : async (props) => {
      try {
        const { id, name, multiplier } = props.event.body as IServiceTier;

        if (!id) throw new Error('Service ID or Service Tier ID Missing');

        const updateProps = buildUpdate({ id, name, multiplier });

        const response = await props.client.query<IServiceTier>(`
          UPDATE service_tiers
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
    method: 'GET',
    path : 'service_tiers',
    cmnd : async (props) => {
      try {

        const response = await props.client.query<IServiceTier>(`
          SELECT * FROM enabled_service_tiers
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'service_tiers/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<IServiceTier>(`
          SELECT * FROM enabled_service_tiers_ext
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
    path : 'service_tiers/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<IServiceTier>(`
          DELETE FROM service_tiers
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'PUT',
    path : 'service_tiers/:id/disable',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.client.query(`
          UPDATE service_tiers
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