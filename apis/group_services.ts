import { asyncForEach, IGroup, IGroupService, IGroupServiceActionTypes, IGroupServiceAddon } from 'awayto/core';
import { ApiModule } from '../api';

const groupServices: ApiModule = [

  {
    action: IGroupServiceActionTypes.POST_GROUP_SERVICE,
    cmnd: async (props) => {
      try {

        const { groupName, serviceId } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        // Attach service to group
        await props.db.query(`
          INSERT INTO dbtable_schema.group_services (group_id, service_id, created_sub)
          VALUES ($1, $2, $3::uuid)
          ON CONFLICT (group_id, service_id) DO NOTHING
          RETURNING id
        `, [groupId, serviceId, props.event.userSub]);

        await props.redis.del(props.event.userSub + `group/${groupName}/services`);

        return [];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IGroupServiceActionTypes.GET_GROUP_SERVICES,
    cmnd: async (props) => {
      try {
        const { groupName } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        const response = await props.db.query<IGroupService>(`
          SELECT es.*, egs."groupId"
          FROM dbview_schema.enabled_group_services egs
          LEFT JOIN dbview_schema.enabled_services es ON es.id = egs."serviceId"
          WHERE egs."groupId" = $1
        `, [groupId]);

        return response.rows;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupServiceActionTypes.DELETE_GROUP_SERVICE,
    cmnd: async (props) => {
      try {

        const { groupName, ids } = props.event.pathParameters;
        const idsSplit = ids.split(',');

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        await asyncForEach(idsSplit, async serviceId => {
          // Detach service from group
          await props.db.query<IGroupService>(`
            DELETE FROM dbtable_schema.group_services
            WHERE group_id = $1 AND service_id = $2
            RETURNING id
          `, [groupId, serviceId]);
        })

        await props.redis.del(props.event.userSub + `group/${groupName}/services`);

        return idsSplit.map(id => ({ id }));
      } catch (error) {
        throw error;
      }

    }
  }
]

export default groupServices;