import { ApiHandlers, IGroup, IGroupRole, IGroupUser, asyncForEach, createHandlers } from 'awayto/core';

export default createHandlers({
  putGroupUser: async props => {
    const { groupName } = props.event.pathParameters;
    const { userId, roleId, roleName } = props.event.body;

    const { roleCall, appClient } = await props.redisProxy('roleCall', 'appClient');

    const { externalId: kcOldSubgroupExternalId, groupExternalId, groupId, userSub } = await props.tx.one<IGroupUser>(`
      SELECT g.external_id as "groupExternalId", gu.external_id as "externalId", gu.group_id as "groupId", u.sub as "userSub"
      FROM dbtable_schema.group_users gu
      JOIN dbtable_schema.users u ON u.id = gu.user_id
      JOIN dbtable_schema.groups g ON g.id = gu.group_id
      WHERE g.name = $1 AND gu.user_id = $2
    `, [groupName, userId]);

    const { externalId: kcNewSubgroupExternalId } = await props.tx.one<IGroupRole>(`
      SELECT external_id as "externalId"
      FROM dbtable_schema.group_roles
      WHERE group_id = $1 AND role_id = $2
    `, [groupId, roleId]);

    await props.keycloak.users.delFromGroup({ id: userSub, groupId: kcOldSubgroupExternalId });
    await props.keycloak.users.addToGroup({ id: userSub, groupId: kcNewSubgroupExternalId });

    await props.tx.none(`
      UPDATE dbtable_schema.group_users
      SET external_id = $3
      WHERE group_id = $1 AND user_id = $2
    `, [groupId, userId, kcNewSubgroupExternalId]);

    await props.keycloak.users.addClientRoleMappings({
      id: userSub,
      clientUniqueId: appClient.id!,
      roles: roleCall
    });

    await props.keycloak.regroup(groupExternalId);

    await props.redis.del(`${userSub}profile/details`);

    await props.redis.del(`${props.event.userSub}group/${groupName}/users`);
    await props.redis.del(`${props.event.userSub}group/${groupName}/users/${userId}`);

    return [{ id: userId, roleId, roleName }];
  },

  getGroupUsers: async props => {
    const { groupName } = props.event.pathParameters;

    const { id: groupId } = await props.db.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    const groupUsers = await props.db.manyOrNone<IGroupUser>(`
      SELECT eu.*, r.id as "roleId", r.name as "roleName"
      FROM dbview_schema.enabled_group_users egu
      LEFT JOIN dbview_schema.enabled_users eu ON eu.id = egu."userId"
      JOIN dbtable_schema.group_users gu ON gu.id = egu.id
      JOIN dbtable_schema.group_roles gr ON gr.external_id = gu.external_id
      JOIN dbtable_schema.roles r ON gr.role_id = r.id
      WHERE egu."groupId" = $1
    `, [groupId]);

    return groupUsers;
  },

  getGroupUserById: async props => {
    const { groupName, userId } = props.event.pathParameters;

    const { id: groupId } = await props.db.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    const user = await props.db.one<IGroupUser>(`
      SELECT
        eu.id,
        egu."groupId",
        egu."userId",
        eu."firstName",
        eu."lastName",
        eu.locked,
        eu.image,
        eu.email,
        er.id as "roleId",
        er.name as "roleName"
      FROM dbview_schema.enabled_group_users egu
      JOIN dbview_schema.enabled_users eu ON eu.id = egu."userId"
      JOIN dbtable_schema.group_users gu ON gu.id = egu.id
      JOIN dbtable_schema.group_roles gr ON gr.external_id = gu.external_id
      JOIN dbview_schema.enabled_roles er ON er.id = gr.role_id
      WHERE egu."groupId" = $1 and egu."userId" = $2
    `, [groupId, userId]);

    return user;
  },

  deleteGroupUser: async props => {
    const { groupName, ids } = props.event.pathParameters;

    const { roleCall, appClient } = await props.redisProxy('roleCall', 'appClient');

    const idsSplit = ids.split(',');

    const { id: groupId, externalId: kcGroupExternalId } = await props.tx.one<IGroup>(`
      SELECT id, external_id as "externalId"
      FROM dbtable_schema.groups
      WHERE name = $1
    `, [groupName]);

    await asyncForEach(idsSplit, async userId => {

      await props.tx.none(`
        DELETE FROM dbtable_schema.group_users
        WHERE group_id = $1 AND user_id = $2
      `, [groupId, userId]);

      const { externalId: kcSubgroupExternalId, userSub } = await props.tx.one<IGroupUser>(`
        SELECT gu.external_id as "externalId", u.sub as "userSub"
        FROM dbtable_schema.group_users gu
        JOIN dbtable_schema.users u ON u.id = gu.user_id
        WHERE gu.id = $1 AND gu.user_id = $2
      `, [groupId, userId]);
  
      await props.keycloak.users.delFromGroup({ id: userSub, groupId: kcSubgroupExternalId });

      await props.keycloak.users.addClientRoleMappings({
        id: userSub,
        clientUniqueId: appClient.id!,
        roles: roleCall
      });
  
      await props.redis.del(`${userSub}profile/details`);
    })


    await props.keycloak.regroup(kcGroupExternalId);

    await props.redis.del(`${props.event.userSub}group/${groupName}/users`);

    return idsSplit.map(id => ({ id }));
  },
  lockGroupUser: async props => {
    
    const { groupName, ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');

    const { roleCall, appClient } = await props.redisProxy('roleCall', 'appClient');

    const { id: groupId } = await props.tx.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    await asyncForEach(idsSplit, async userId => {
      await props.tx.none(`
        UPDATE dbtable_schema.group_users
        SET locked = true
        WHERE group_id = $1 AND user_id = $2
      `, [groupId, userId]);

      // Add role call and force role change

      const { externalId: kcSubgroupExternalId, userSub } = await props.tx.one<IGroupUser>(`
        SELECT gu.external_id as "externalId", u.sub as "userSub"
        FROM dbtable_schema.group_users gu
        JOIN dbtable_schema.users u ON u.id = gu.user_id
        WHERE gu.id = $1 AND gu.user_id = $2
      `, [groupId, userId]);

      await props.keycloak.users.delFromGroup({ id: userSub, groupId: kcSubgroupExternalId });

      await props.keycloak.users.addClientRoleMappings({
        id: userSub,
        clientUniqueId: appClient.id!,
        roles: roleCall
      });

      await props.redis.del(`${userSub}profile/details`);
    });

    await props.redis.del(props.event.userSub + `group/${groupName}/users`);

    return idsSplit.map(id => ({ id }));
  },
  unlockGroupUser: async props => {
    const { groupName, ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');

    const { id: groupId } = await props.tx.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    await asyncForEach(idsSplit, async userId => {
      // Detach user from group
      await props.tx.none(`
        UPDATE dbtable_schema.group_users
        SET locked = false
        WHERE group_id = $1 AND user_id = $2
      `, [groupId, userId]);
    });

    await props.redis.del(props.event.userSub + `group/${groupName}/users`);

    return idsSplit.map(id => ({ id }));
  }
});