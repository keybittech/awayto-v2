import { asyncForEach, IGroup, IGroupSchedule, IGroupScheduleActionTypes, IGroupService, ISchedule, IScheduleActionTypes, IUserProfile } from 'awayto';
import { ApiEvent, ApiModule } from '../api';
import schedules from './schedules';

const groupSchedules: ApiModule = [

  {
    action: IGroupScheduleActionTypes.POST_GROUP_SCHEDULE,
    cmnd: async (props) => {
      try {

        const { groupName } = props.event.pathParameters;

        const { rows: [{ id: groupId }] } = await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName]);

        const { rows: [{ sub: groupSub }] } = await props.db.query<IUserProfile>(`
          SELECT sub
          FROM dbview_schema.enabled_users
          WHERE username = $1
        `, ['system_group_' + groupName]);

        const postSchedule = schedules.find(api => api.action === IScheduleActionTypes.POST_SCHEDULE);

        const [schedule] = await postSchedule?.cmnd({
          event: {
            ...props.event,
            userSub: groupSub,
            body: props.event.body
          } as ApiEvent,
          db: props.db,
          redis: props.redis
        }) as [IGroupSchedule];
        
        schedule.groupId = groupId;

        // Attach schedule to group
        await props.db.query(`
          INSERT INTO dbtable_schema.group_schedules (group_id, schedule_id, created_sub)
          VALUES ($1, $2, $3::uuid)
          ON CONFLICT (group_id, schedule_id) DO NOTHING
          RETURNING id
        `, [groupId, schedule.id, groupSub]);

        await props.redis.del(`${props.event.userSub}group/${groupName}/schedules`);

        return [schedule];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IGroupScheduleActionTypes.PUT_GROUP_SCHEDULE,
    cmnd: async (props) => {
      try {

        const { groupName } = props.event.pathParameters;

        const postSchedule = schedules.find(api => api.action === IScheduleActionTypes.PUT_SCHEDULE);

        const [schedule] = await postSchedule?.cmnd({
          event: {
            ...props.event,
            body: props.event.body
          } as ApiEvent,
          db: props.db,
          redis: props.redis
        }) as [IGroupSchedule];

        await props.redis.del(`${props.event.userSub}group/${groupName}/schedules`);
        await props.redis.del(`${props.event.userSub}group/${groupName}/schedulemaster/${schedule.id}`);

        return [schedule];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IGroupScheduleActionTypes.GET_GROUP_SCHEDULES,
    cmnd: async (props) => {
      try {
        const { groupName } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        const response = await props.db.query<IGroupSchedule>(`
          SELECT es.*, eus."groupId"
          FROM dbview_schema.enabled_group_schedules eus
          LEFT JOIN dbview_schema.enabled_schedules es ON es.id = eus."scheduleId"
          WHERE eus."groupId" = $1
        `, [groupId]);

        return response.rows;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupScheduleActionTypes.GET_GROUP_SCHEDULE_MASTER_BY_ID,
    cmnd: async (props) => {
      try {
        const { groupName, scheduleId } = props.event.pathParameters;

        const response = await props.db.query<ISchedule>(`
          SELECT ese.*
          FROM dbview_schema.enabled_schedules_ext ese
          JOIN dbview_schema.enabled_users eu ON eu.sub = ese."createdSub"
          WHERE ese.id = $1 AND eu.username = $2
        `, [scheduleId, 'system_group_' + groupName]);

        return response.rows;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupScheduleActionTypes.GET_GROUP_SCHEDULE_BY_DATE,
    cache: 'skip',
    cmnd: async (props) => {

      const { scheduleId, date, } = props.event.pathParameters;

      const timezone = Buffer.from(props.event.pathParameters.timezone, 'base64');

      const response = await props.db.query(`
        SELECT * FROM dbfunc_schema.get_group_schedules($1, $2, $3);
      `, [date, scheduleId, timezone]);

      return response.rows;
    }
  },

  {
    action: IGroupScheduleActionTypes.DELETE_GROUP_SCHEDULE,
    cmnd: async (props) => {
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
            DELETE FROM dbtable_schema.group_schedules
            WHERE group_id = $1 AND schedule_id = $2
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

export default groupSchedules;