import { IGroup, IGroupRole, asyncForEach, createHandlers } from 'awayto/core';

export default createHandlers({
  postGroupRole: async props => {
    return { success: true };
  },
  putGroupRole: async props => {
    return { success: true };
  },
  getGroupRoles: async props => {
    const { groupName } = props.event.pathParameters;

    const { id: groupId } = await props.db.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    const roles = await props.db.manyOrNone<IGroupRole>(`
      SELECT 
        er.id,
        er.name,
        egr."roleId",
        egr."groupId"
      FROM dbview_schema.enabled_group_roles egr
      JOIN dbview_schema.enabled_roles er ON er.id = egr."roleId"
      WHERE egr."groupId" = $1
    `, [groupId]);

    return roles;
  },
  deleteGroupRole: async props => {
    const { groupName, ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');

    await asyncForEach(idsSplit, async roleId => {
      await props.tx.none(`
        DELETE FROM dbtable_schema.group_roles
        WHERE role_id = $1
      `, [roleId]);
    });

    await props.redis.del(props.event.userSub + `group/${groupName}/roles`);

    return idsSplit.map(id => ({ id }));
  }
});