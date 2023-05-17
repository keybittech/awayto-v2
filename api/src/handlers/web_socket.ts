import { createHandlers } from 'awayto/core';

export default createHandlers({
  getSocketParticipant: async props => {
    const { connectionId } = props.event.pathParameters;
    const { initials, role } = await props.db.one<{ initials: string, role: string }>(`
      SELECT LEFT(u.first_name, 1) || LEFT(u.last_name, 1) as initials --, r.name as role
      FROM dbtable_schema.sock_connections sc
      JOIN dbtable_schema.users u ON u.sub = sc.created_sub
      -- JOIN dbtable_schema.group_users gu ON gu.user_id = u.id
      -- JOIN dbtable_schema.group_roles gr ON gr.external_id = gu.external_id
      -- JOIN dbtable_schema.roles r ON r.id = gr.role_id
      WHERE sc.connection_id = $1
    `, [connectionId])
    return { name: initials.toUpperCase(), role: 'Tutor' };
  }
})