import { IGroup, IGroupService, IGroupServiceActionTypes, IGroupServiceAddon } from 'awayto';
import { ApiModule } from '../api';

const groupServices: ApiModule = [

  {
    action: IGroupServiceActionTypes.POST_GROUP_SERVICE,
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


        console.log({ GRPSVCDELREDIS: props.event.userSub + `group/${groupName}/services` })
        await props.redis.del(props.event.userSub + `group/${groupName}/services`);
        
        return [];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IGroupServiceActionTypes.GET_GROUP_SERVICES,
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
    action: IGroupServiceActionTypes.DELETE_GROUP_SERVICE,
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

        await props.redis.del(props.event.userSub + `group/${groupName}/services`);

        return [{ id: serviceId }];
      } catch (error) {
        throw error;
      }

    }
  }
]

export default groupServices;