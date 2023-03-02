import { asyncForEach, IGroupUserScheduleActionTypes, IGroupService, IGroupUserSchedule } from 'awayto';
import { ApiModule } from '../api';

const groupUserSchedules: ApiModule = [

  {
    action: IGroupUserScheduleActionTypes.POST_GROUP_USER_SCHEDULE,
    cmnd: async (props) => {
      try {

        const { groupName, groupScheduleId, userScheduleId } = props.event.pathParameters;

        await props.db.query(`
          INSERT INTO dbtable_schema.group_user_schedules (group_schedule_id, user_schedule_id, created_sub)
          VALUES ($1::uuid, $2::uuid, $3::uuid)
          ON CONFLICT (group_schedule_id, user_schedule_id) DO NOTHING
        `, [groupScheduleId, userScheduleId, props.event.userSub])

        await props.redis.del(`${props.event.userSub}group/${groupName}/schedules/${groupScheduleId}/user`);

        return [];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IGroupUserScheduleActionTypes.PUT_GROUP_USER_SCHEDULE,
    cmnd: async (props) => {
      try {

        return false;

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IGroupUserScheduleActionTypes.GET_GROUP_USER_SCHEDULES,
    cmnd: async (props) => {
      try {
        const { groupScheduleId } = props.event.pathParameters;

        const response = await props.db.query<IGroupUserSchedule>(`
          SELECT egus.*
          FROM dbview_schema.enabled_group_user_schedules_ext egus
          WHERE egus."groupScheduleId" = $1
        `, [groupScheduleId]);

        return response.rows;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupUserScheduleActionTypes.DELETE_GROUP_USER_SCHEDULE,
    cmnd: async (props) => {
      try {

        const { groupName, groupScheduleId, ids } = props.event.pathParameters;
        const idsSplit = ids.split(',');

        await asyncForEach(idsSplit, async scheduleId => {
          // Detach schedule from group
          await props.db.query<IGroupService>(`
            DELETE FROM dbtable_schema.group_user_schedules
            WHERE group_schedule_id = $1 AND schedule_id = $2
            RETURNING id
          `, [groupScheduleId, scheduleId]);
        });

        await props.redis.del(props.event.userSub + `group/${groupName}/schedules`);

        return idsSplit.map(id => ({ id }));
      } catch (error) {
        throw error;
      }

    }
  }
]

export default groupUserSchedules;