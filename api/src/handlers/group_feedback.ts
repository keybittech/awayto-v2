import { IGroupFeedback, createHandlers } from 'awayto/core';

export default createHandlers({
  postGroupFeedback: async props => {
    const { message } = props.event.body;

    await props.tx.none(`
      INSERT INTO dbtable_schema.group_feedback (message, group_id, created_sub, created_on)
      VALUES ($1, $2::uuid, $3::uuid, $4)
    `, [message, props.event.group.id, props.event.userSub, new Date()]);

    return { success: true };
  },
  getGroupFeedback: async props => {
    const feedback = await props.db.manyOrNone<IGroupFeedback>(`
      SELECT f.id, f.message, f.created_on as "createdOn"
      FROM dbtable_schema.group_feedback f
      JOIN dbtable_schema.users u ON u.sub = f.created_sub
      WHERE f.group_id = $1
      ORDER BY f.created_on DESC
    `, [props.event.group.id]);

    return feedback;
  },
});