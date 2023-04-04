import { asyncForEach, IGroupUserScheduleActionTypes, IGroupService, IGroupUserSchedule, ScheduledParts, IGroupUserScheduleStub, IGroupUserScheduleState, utcNowString } from 'awayto/core';
import { buildUpdate } from '../util/db';
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
          SELECT guss.*, gus.group_schedule_id as "groupScheduleId"
          FROM dbview_schema.group_user_schedule_stubs guss
          JOIN dbtable_schema.group_user_schedules gus ON gus.user_schedule_id = guss."userScheduleId"
          JOIN dbtable_schema.schedules schedule ON schedule.id = gus.group_schedule_id
          JOIN dbview_schema.enabled_users eu ON eu.sub = schedule.created_sub
          WHERE eu.username = $1
        `, ['system_group_' + groupName]);

        return { stubs: response.rows };

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupUserScheduleActionTypes.GET_GROUP_USER_SCHEDULE_STUB_REPLACEMENT,
    cmnd: async (props) => {
      try {
        const { userScheduleId } = props.event.pathParameters;
        const { slotDate, startTime, tierName } = props.event.queryParameters;

        const { rows: stubs } = await props.db.query<IGroupUserScheduleStub>(`
          SELECT replacement FROM dbfunc_schema.get_peer_schedule_replacement($1::UUID[], $2::DATE, $3::INTERVAL, $4::TEXT)
        `, [[userScheduleId], slotDate, startTime, tierName]);

        return { stubs };

      } catch (error) {
        throw error;
      }

    }

  },

  {
    action: IGroupUserScheduleActionTypes.PUT_GROUP_USER_SCHEDULE_STUB_REPLACEMENT,
    cmnd: async (props) => {

      const { quoteId, slotDate, scheduleBracketSlotId, serviceTierId } = props.event.body

      const updateProps = buildUpdate({
        id: quoteId,
        slot_date: slotDate,
        schedule_bracket_slot_id: scheduleBracketSlotId,
        service_tier_id: serviceTierId,
        updated_sub: props.event.userSub,
        updated_on: utcNowString()
      });

      await props.db.query(`
        UPDATE dbtable_schema.quotes
        SET ${updateProps.string}
        WHERE id = $1
      `, updateProps.array)

      return true;
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