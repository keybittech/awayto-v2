import { IFeedback, IFeedbackActionTypes } from 'awayto/core';
import { ApiModule } from '../api';

const groupFeedbacks: ApiModule = [

  {
    action: IFeedbackActionTypes.POST_FEEDBACK,
    cmnd : async (props) => {
      try {

        const { message, groupName } = props.event.body;

        const { rows: [{ id: groupId }] } = await props.db.query(`
          SELECT id FROM dbtable_schema.groups
          WHERE name = $1
        `, [groupName])

        await props.db.query(`
          INSERT INTO dbtable_schema.group_feedback (message, group_id, created_sub, created_on)
          VALUES ($1, $2::uuid, $3::uuid, $4)
        `, [message, groupId, props.event.userSub, new Date()]);

        return true;

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IFeedbackActionTypes.GET_FEEDBACK,
    cmnd : async (props) => {
      try {

        const { groupName } = props.event.pathParameters;

        const { rows: [{ id: groupId }] } = await props.db.query(`
          SELECT id FROM dbtable_schema.groups
          WHERE name = $1
        `, [groupName])

        const result = await props.db.query<IFeedback>(`
          SELECT f.id, f.message, f.created_on as "createdOn", u.username
          FROM dbtable_schema.group_feedback f
          JOIN dbtable_schema.users u ON u.sub = f.created_sub
          WHERE f.group_id = $1
          ORDER BY f.created_on DESC
        `, [groupId])

        return result.rows;

      } catch (error) {
        throw error;
      }
    }
  },

]

export default groupFeedbacks;