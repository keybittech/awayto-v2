import { IFeedback, IGroup, createHandlers } from 'awayto/core';

export default createHandlers({
  postGroupFeedback: async props => {
    const { message, groupName } = props.event.body;

    const { id: groupId } = await props.tx.one<IGroup>(`
      SELECT id FROM dbtable_schema.groups
      WHERE name = $1
    `, [groupName]);

    await props.tx.none(`
      INSERT INTO dbtable_schema.group_feedback (message, group_id, created_sub, created_on)
      VALUES ($1, $2::uuid, $3::uuid, $4)
    `, [message, groupId, props.event.userSub, new Date()]);

    return { success: true };
  },
  getGroupFeedback: async props => {
    const { groupName } = props.event.pathParameters;

    const { id: groupId } = await props.db.one<IGroup>(`
      SELECT id FROM dbtable_schema.groups
      WHERE name = $1
    `, [groupName]);

    const feedback = await props.db.manyOrNone<IFeedback>(`
      SELECT f.id, f.message, f.created_on as "createdOn"
      FROM dbtable_schema.group_feedback f
      JOIN dbtable_schema.users u ON u.sub = f.created_sub
      WHERE f.group_id = $1
      ORDER BY f.created_on DESC
    `, [groupId]);

    return feedback;
  },
});