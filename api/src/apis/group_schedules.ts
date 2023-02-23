import { asyncForEach, IGroup, IGroupScheduleActionTypes, IGroupService, IGroupServiceAddon } from 'awayto';
import { ApiModule } from '../api';

const groupServices: ApiModule = [

  {
    action: IGroupScheduleActionTypes.POST_GROUP_SCHEDULE,
    cmnd : async (props) => {
      try {

        const { groupName, scheduleId } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        // Attach schedule to group
        await props.db.query(`
          INSERT INTO dbtable_schema.uuid_schedules (parent_uuid, schedule_id, created_sub)
          VALUES ($1, $2, $3::uuid)
          ON CONFLICT (parent_uuid, schedule_id) DO NOTHING
          RETURNING id
        `, [groupId, scheduleId, props.event.userSub]);

        await props.redis.del(`${props.event.userSub}group/${groupName}/schedules`);
        
        return [];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IGroupScheduleActionTypes.GET_GROUP_SCHEDULES,
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
          FROM dbview_schema.enabled_uuid_schedules eus
          LEFT JOIN dbview_schema.enabled_schedules es ON es.id = eus."scheduleId"
          WHERE eus."parentUuid" = $1
        `, [groupId]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupScheduleActionTypes.DELETE_GROUP_SCHEDULE,
    cmnd : async (props) => {
      try {

        const { groupName, ids } = props.event.pathParameters;
        const idsSplit = ids.split(',');

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        await asyncForEach(idsSplit, async scheduleId => {
          // Detach schedule from group
          await props.db.query<IGroupService>(`
            DELETE FROM dbtable_schema.uuid_schedules
            WHERE parent_uuid = $1 AND schedule_id = $2
            RETURNING id
          `, [groupId, scheduleId]);
        })

        await props.redis.del(props.event.userSub + `group/${groupName}/schedules`);

        return idsSplit.map(id => ({ id }));
      } catch (error) {
        throw error;
      }

    }
  }
]

export default groupServices;