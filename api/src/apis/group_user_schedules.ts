import { asyncForEach, IGroupUserScheduleActionTypes, IGroupService, IGroupUserSchedule, ScheduledParts, IGroupUserScheduleStub, IGroupUserScheduleState } from 'awayto';
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
    action: IGroupUserScheduleActionTypes.GET_GROUP_USER_SCHEDULE_STUBS,
    cache: 'skip',
    cmnd: async (props) => {
      try {
        const { groupName } = props.event.pathParameters;

        const response = await props.db.query<IGroupUserScheduleStub>(`
          SELECT guss.*
          FROM dbview_schema.group_user_schedule_stubs guss
          JOIN dbtable_schema.schedules schedule ON schedule.id = guss."groupScheduleId"
          JOIN dbview_schema.enabled_users eu ON eu.sub = schedule.created_sub
          WHERE eu.username = $1
        `, ['system_group_' + groupName]);

        return { stubs: response.rows } as IGroupUserScheduleState;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupUserScheduleActionTypes.DELETE_GROUP_USER_SCHEDULE_BY_USER_SCHEDULE_ID,
    cmnd: async (props) => {
      try {

        const { groupName, ids } = props.event.pathParameters;
        const idsSplit = ids.split(',');

        await asyncForEach(idsSplit, async userScheduleId => {

          const { rows: parts } = await props.db.query<ScheduledParts>(`
            SELECT * FROM dbfunc_schema.get_scheduled_parts($1);
          `, [userScheduleId]);

          const hasParts = parts.some(p => p.ids?.length);

          if (!hasParts) {
            // Detach user schedule from group
            await props.db.query<IGroupService>(`
              DELETE FROM dbtable_schema.group_user_schedules
              WHERE user_schedule_id = $1
              RETURNING id
            `, [userScheduleId]);
          } else {
            await props.db.query<IGroupService>(`
              UPDATE dbtable_schema.group_user_schedules
              SET enabled = false
              WHERE user_schedule_id = $1
              RETURNING id
            `, [userScheduleId]);
          }
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