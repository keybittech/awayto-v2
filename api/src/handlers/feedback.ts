import { createHandlers } from 'awayto/core';

export default createHandlers({
  postSiteFeedback: async props => {
    const { message } = props.event.body;

    await props.tx.none(`
      INSERT INTO dbtable_schema.feedback (message, created_sub, created_on)
      VALUES ($1, $2::uuid, $3)
    `, [message, props.event.userSub, new Date()]);

    return { success: true };
  },
});