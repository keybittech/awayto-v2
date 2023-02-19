import { IGroup, IGroupService, IGroupServiceAddon } from 'awayto';
import { ApiModule } from '../api';

const groupServices: ApiModule = [

  {
    method: 'GET',
    path : 'group/:groupName/services/:serviceId',
    cmnd : async (props) => {
      try {

        const { groupName, serviceId } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        // Attach service to group
        await props.db.query(`
          INSERT INTO uuid_services (parent_uuid, service_id, created_sub)
          VALUES ($1, $2, $3)
          ON CONFLICT (parent_uuid, service_id) DO NOTHING
          RETURNING id
        `, [groupId, serviceId, props.event.userSub]);

        props.redis.del(props.event.userSub + `group/${groupName}/services`);
        
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

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        const response = await props.db.query<IGroupServiceAddon>(`
          SELECT es.*, eus."parentUuid" as "groupId"
          FROM dbview_schema.enabled_uuid_services eus
          LEFT JOIN dbview_schema.enabled_services es ON es.id = eus."serviceId"
          WHERE eus."parentUuid" = $1
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

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        // Detach service from group
        await props.db.query<IGroupService>(`
          DELETE FROM uuid_services
          WHERE parent_uuid = $1 AND service_id = $2
          RETURNING id
        `, [groupId, serviceId]);

        props.redis.del(props.event.userSub + `group/${groupName}/services`);

        return [{ id: serviceId }];
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
        const { groupName, id } = props.event.pathParameters;

        await props.db.query(`
          UPDATE services
          SET enabled = false
          WHERE id = $1
        `, [id]);

        props.redis.del(props.event.userSub + `group/${groupName}/service_addons`);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  }

]

export default groupServices;