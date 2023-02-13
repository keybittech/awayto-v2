import { IGroup, IGroupService, IGroupServiceAddon } from 'awayto';
import { ApiModule } from '../util/db';

const groupServices: ApiModule = [

  {
    method: 'GET',
    path : 'group/:groupName/schedules/:scheduleId',
    cmnd : async (props) => {
      try {

        const { groupName, scheduleId } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.client.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        // Attach schedule to group
        await props.client.query(`
          INSERT INTO uuid_schedules (parent_uuid, schedule_id, created_sub)
          VALUES ($1, $2, $3)
          ON CONFLICT (parent_uuid, schedule_id) DO NOTHING
          RETURNING id
        `, [groupId, scheduleId, props.event.userSub]);
        
        return [];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'GET',
    path : 'group/:groupName/schedules',
    cmnd : async (props) => {
      try {
        const { groupName } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.client.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        const response = await props.client.query<IGroupServiceAddon>(`
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
    method: 'DELETE',
    path : 'group/:groupName/schedules/:scheduleId',
    cmnd : async (props) => {
      try {

        const { groupName, scheduleId } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.client.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        // Detach schedule from group
        await props.client.query<IGroupService>(`
          DELETE FROM uuid_schedules
          WHERE parent_uuid = $1 AND schedule_id = $2
          RETURNING id
        `, [groupId, scheduleId]);

        return [{ id: scheduleId }];
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'PUT',
    path : 'group/:groupName/schedules/:id/disable',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.client.query(`
          UPDATE schedules
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