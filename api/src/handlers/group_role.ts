import { IGroup, IGroupRole, IRole, asyncForEach, buildUpdate, createHandlers, utcNowString } from 'awayto/core';

export default createHandlers({
  postGroupRole: async props => {
    const { role } = props.event.body;

    const group = await props.tx.one<IGroup>(`
      SELECT external_id as "externalId"
      FROM dbtable_schema.groups
      WHERE id = $1 AND enabled = true
    `, [props.event.group.id]);

    const { id: kcSubgroupId } = await props.keycloak.groups.setOrCreateChild({ id: group.externalId }, { name: role.name });

    await props.tx.none(`
      INSERT INTO dbtable_schema.group_roles (group_id, role_id, external_id, created_on, created_sub)
      VALUES ($1, $2, $3, $4, $5::uuid)
      ON CONFLICT (group_id, role_id) DO NOTHING
    `, [props.event.group.id, role.id, kcSubgroupId, utcNowString(), props.event.userSub]);

    return { success: true };
  },
  putGroupRoles: async props => {
    const { roles, defaultRoleId } = props.event.body;

    const updateProps = buildUpdate({
      id: props.event.group.id || '',
      default_role_id: defaultRoleId,
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });

    // Update the basic info about the group in the app DB
    const { externalId: groupExternalId, ...group } = await props.tx.one<IGroup>(`
      UPDATE dbtable_schema.groups
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id, name, external_id as "externalId"
    `, updateProps.array);

    // See if any roles have changed, "rolesIds"/"roles" are the new incoming roles
    const roleIds = Object.keys(roles);

    // Get all the group_roles by the group's id
    const diffs = (await props.tx.manyOrNone<IGroupRole>(`
      SELECT id, "roleId" 
      FROM dbview_schema.enabled_group_roles 
      WHERE "groupId" = $1
    `, [group.id])).filter(r => !roleIds.includes(r.roleId));

    // Diffs is filtered, now unused roles
    if (diffs.length) {

      // Delete keycloak subgroups under the parent group which are no longer present
      const externalGroup = await props.keycloak.groups.findOne({ id: groupExternalId });
      if (externalGroup?.subGroups) {
        const roleNames = (await props.tx.manyOrNone<IRole>(`
          SELECT name 
          FROM dbview_schema.enabled_roles 
          WHERE id = ANY($1::uuid[])
        `, [diffs.map(r => r.roleId)])).map(r => r.name) as string[];
        for (const subGroupId in externalGroup.subGroups.filter(sg => roleNames.includes(sg.name as string))) {
          const subGroup = externalGroup.subGroups[subGroupId];
          if (subGroup.id) {
            await props.keycloak.groups.del({ id: subGroup.id });
          }
        }
      }

      // Remove the role associations from the group
      await props.tx.none(`
        DELETE FROM dbtable_schema.group_roles
        WHERE id = ANY($1::uuid[]) 
      `, [diffs.map(r => r.id)]);
    }

    // Reestablish subgroup namespaces in keycloak, and group role associations in app db
    for (const roleId in Object.keys(roles)) {
      const role = roles[roleId];
      if (role.name.toLowerCase() === 'admin') continue;
      const { id: kcSubgroupId } = await props.keycloak.groups.setOrCreateChild({ id: groupExternalId }, { name: role.name });
      await props.tx.none(`
        INSERT INTO dbtable_schema.group_roles (group_id, role_id, external_id, created_on, created_sub)
        VALUES ($1, $2, $3, $4, $5::uuid)
        ON CONFLICT (group_id, role_id) DO NOTHING
      `, [group.id, role.id, kcSubgroupId, utcNowString(), props.event.userSub]);
    }

    await props.redis.del(props.event.userSub + 'profile/details');

    return { success: true };
  },
  getGroupRoles: async props => {
    const roles = await props.db.manyOrNone<IGroupRole>(`
      SELECT 
        er.id,
        er.name,
        egr."roleId",
        egr."groupId",
        egr."createdOn"
      FROM dbview_schema.enabled_group_roles egr
      JOIN dbview_schema.enabled_roles er ON er.id = egr."roleId"
      WHERE egr."groupId" = $1 AND er.name != 'Admin'
    `, [props.event.group.id]);

    return roles;
  },
  deleteGroupRole: async props => {
    const { ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');

    await asyncForEach(idsSplit, async roleId => {
      await props.tx.none(`
        DELETE FROM dbtable_schema.group_roles
        WHERE role_id = $1
      `, [roleId]);
    });

    await props.redis.del(props.event.userSub + `group/roles`);

    return idsSplit.map(id => ({ id }));
  }
});