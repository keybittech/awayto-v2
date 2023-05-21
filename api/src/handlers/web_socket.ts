import { SocketParticipant, charCount, createHandlers } from 'awayto/core';

export default createHandlers({
  getSocketParticipants: async props => {
    const { cids } = props.event.pathParameters;
    const participants = (await props.db.manyOrNone<SocketParticipant>(`
      SELECT ARRAY[tm.connection_id] as cids, tm.created_sub as scid, LEFT(u.first_name, 1) || LEFT(u.last_name, 1) as name --, r.name as role
      FROM dbtable_schema.topic_messages tm
      JOIN dbtable_schema.users u ON u.sub = tm.created_sub
      -- JOIN dbtable_schema.group_users gu ON gu.user_id = u.id
      -- JOIN dbtable_schema.group_roles gr ON gr.external_id = gu.external_id
      -- JOIN dbtable_schema.roles r ON r.id = gr.role_id
      WHERE tm.connection_id = ANY($1::text[])
    `, [cids.split(',')])).map(part => ({
      scid: `${part.name}#${charCount(part.scid)}`,
      cids: part.cids,
      name: part.name.toUpperCase(),
      role: 'Tutor'
    }) as SocketParticipant);
    return participants;
  }
})