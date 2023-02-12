import { IGroup, IGroupService, IGroupServiceAddon } from 'awayto';
import { ApiModule, buildUpdate } from '../util/db';

const groupServices: ApiModule = [

  {
    method: 'POST',
    path : 'group/:groupName/services/:serviceId',
    cmnd : async (props) => {
      try {

        const { groupName, serviceId } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.client.query<IGroup>(`
          SELECT id
          FROM enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        // Attach service to group
        await props.client.query(`
          INSERT INTO uuid_services (parent_uuid, service_id, created_sub)
          VALUES ($1, $2, $3)
          ON CONFLICT (parent_uuid, service_id) DO NOTHING
          RETURNING id
        `, [groupId, serviceId, props.event.userSub]);
        
        return [];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'GET',
    path : 'group/:groupName/services',
    cmnd : async (props) => {
      try {
        const { groupName } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.client.query<IGroup>(`
          SELECT id
          FROM enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        const response = await props.client.query<IGroupServiceAddon>(`
          SELECT esa.*, eusa."parentId" as "groupId"
          FROM enabled_uuid_services eusa
          LEFT JOIN enabled_services esa ON esa.id = eusa."groupServiceId"
          WHERE eusa."parentUuid" = $1
        `, [groupId]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'DELETE',
    path : 'group/:groupName/services/:serviceId',
    cmnd : async (props) => {
      try {

        const { groupName, serviceId } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.client.query<IGroup>(`
          SELECT id
          FROM enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        // Detach service from group
        const response = await props.client.query<IGroupService>(`
          DELETE FROM uuid_services
          WHERE parent_uuid = $1 AND service_id = $2
          RETURNING id
        `, [groupId, serviceId]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'PUT',
    path : 'group/:groupName/services/:id/disable',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.client.query(`
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

export default groupServices;