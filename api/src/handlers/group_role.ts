import { IGroup, IGroupRole, asyncForEach, createHandlers, utcNowString } from 'awayto/core';

export default createHandlers({
  postGroupRole: async props => {
    const { groupName, role } = props.event.body;

    const group = await props.tx.one<IGroup>(`
      SELECT id, external_id as "externalId"
      FROM dbtable_schema.groups
      WHERE name = $1 AND enabled = true
    `, [groupName]);

    const { id: kcSubgroupId } = await props.keycloak.groups.setOrCreateChild({ id: group.externalId }, { name: role.name });

    await props.tx.none(`
      INSERT INTO dbtable_schema.group_roles (group_id, role_id, external_id, created_on, created_sub)
      VALUES ($1, $2, $3, $4, $5::uuid)
      ON CONFLICT (group_id, role_id) DO NOTHING
    `, [group.id, role.id, kcSubgroupId, utcNowString(), props.event.userSub]);

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
        egr."groupId",
        egr."createdOn"
      FROM dbview_schema.enabled_group_roles egr
      JOIN dbview_schema.enabled_roles er ON er.id = egr."roleId"
      WHERE egr."groupId" = $1 AND er.name IS NOT 'Admin'
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