import { IPrompts } from '@keybittech/wizapp/dist/lib';
import { ApiInternalError, DbError, IGroup, IGroupRole, IGroupRoleAuthActions, IRole, IUserProfile, buildUpdate, utcNowString, asyncForEach, nid, createHandlers } from 'awayto/core';

export default createHandlers({
  postGroup: async props => {
    let kcGroupExternalId = '';

    try {
      const { name, displayName, purpose, allowedDomains } = props.event.body;

      if (process.env.OPENAI_API_KEY && true === (await props.ai.useAi<boolean>(undefined, purpose)).flagged) {
        props.logger.log('moderation failure event', props.event.requestId);
        throw { reason: 'Moderation event flagged. Please revise the group purpose.' };
      }

      // Do this first for now to check if user already made a group
      // Create a group in app db if user has no groups and name is unique
      const group = await props.tx.one<IGroup>(`
        INSERT INTO dbtable_schema.groups (external_id, code, admin_external_id, name, purpose, allowed_domains, created_sub, display_name)
        VALUES ($1, $2, $3, $4, $5, $6, $7::uuid, $8)
        RETURNING id, name
      `, [props.event.userSub, props.event.userSub, props.event.userSub, name, props.event.userSub, allowedDomains, props.event.userSub, displayName]);

      try {
        // Create a keycloak group if the previous operation was allowed
        const { id: kcGroupId } = await props.keycloak.groups.create({ name });
        kcGroupExternalId = kcGroupId;
      } catch (error) {
        if (409 === (error as ApiInternalError).response.status) {
          await props.tx.none(`
            DELETE FROM dbtable_schema.groups
            WHERE id = $1
          `, [group.id]);
          throw { reason: 'The group name is in use.' }
        }
      }

      const purposeMission = process.env.OPENAI_API_KEY ? (await props.ai.useAi<string>(IPrompts.CONVERT_PURPOSE, name, purpose)).message : "Primary";

      const { groupAdminRoles, appClient, roleCall, adminRoleId } = await props.redisProxy('groupAdminRoles', 'appClient', 'roleCall', 'adminRoleId');

      await props.tx.none(`
        INSERT INTO dbtable_schema.users (sub, username, created_on, created_sub)
        VALUES ($1::uuid, $2, $3, $1::uuid)
      `, [nid('v4'), 'system_group_' + group.id, new Date()]);

      // Create an Admin subgroup in keycloak for this group
      const { id: kcAdminSubgroupExternalId } = await props.keycloak.groups.setOrCreateChild({ id: kcGroupExternalId }, { name: 'Admin' });

      // Add the Admin subgroup/role to the app db
      await props.tx.none(`
        INSERT INTO dbtable_schema.group_roles (group_id, role_id, external_id, created_on, created_sub)
        VALUES ($1, $2, $3, $4, $5::uuid)
        ON CONFLICT (group_id, role_id) DO NOTHING
      `, [group.id, adminRoleId, kcAdminSubgroupExternalId, utcNowString(), props.event.userSub]);
      
      // Add admin roles to the admin subgroup
      await props.keycloak.groups.addClientRoleMappings({
        id: kcAdminSubgroupExternalId,
        clientUniqueId: appClient.id!,
        roles: groupAdminRoles as { id: string, name: string }[]
      });

      // Attach the user to the admin subgroup
      await props.keycloak.users.addToGroup({
        id: props.event.userSub,
        groupId: kcAdminSubgroupExternalId
      });

      // Update the group with keycloak reference id
      await props.tx.none(`
        UPDATE dbtable_schema.groups 
        SET external_id = $2, admin_external_id = $3, purpose = $4
        WHERE id = $1
      `, [group.id, kcGroupExternalId, kcAdminSubgroupExternalId, purposeMission]);

      // For each group role, create a keycloak subgroup and attach to group_roles
      // for (const roleId in roles) {
      //   const { name: roleName } = roles[roleId];
      //   if (name.toLowerCase() === 'admin') continue;
      //   const { id: kcSubgroupId } = await props.keycloak.groups.setOrCreateChild({ id: kcGroupExternalId }, { name: roleName });
      //   await props.tx.none(`
      //     INSERT INTO dbtable_schema.group_roles (group_id, role_id, external_id, created_on, created_sub)
      //     VALUES ($1, $2, $3, $4, $5::uuid)
      //     ON CONFLICT (group_id, role_id) DO NOTHING
      //   `, [group.id, roleId, kcSubgroupId, utcNowString(), props.event.userSub]);
      // }

      // Get the group admin's id
      const { id: userId } = await props.tx.one<IUserProfile>(`
        SELECT id FROM dbview_schema.enabled_users WHERE sub = $1
      `, [props.event.userSub]);

      // Attach the group admin to the group in the app db
      await props.tx.none(`
        INSERT INTO dbtable_schema.group_users (user_id, group_id, external_id, created_sub)
        VALUES ($1, $2, $3, $4::uuid)
        ON CONFLICT (user_id, group_id) DO NOTHING
      `, [userId, group.id, kcAdminSubgroupExternalId, props.event.userSub]);

      // Attach role call so the group admin's roles force update
      await props.keycloak.users.addClientRoleMappings({
        id: props.event.userSub,
        clientUniqueId: appClient.id!,
        roles: roleCall
      });

      // Refresh redis cache of group users/roles
      await props.keycloak.regroup(kcGroupExternalId);

      await props.redis.del(props.event.userSub + 'profile/details');

      return { id: group.id }; // roles

    } catch (error) {
      const { constraint } = error as DbError;

      try {
        await props.keycloak.groups.del({ id: kcGroupExternalId });
      } catch (error) {}

      if ('unique_group_owner' === constraint) {
        throw { reason: 'Only 1 group can be managed at a time.' }
      }

      throw error;
    }
  },
  putGroup: async props => {
    const { id, name, displayName, purpose } = props.event.body;

    const updateProps = buildUpdate({
      id,
      name,
      purpose,
      display_name: displayName,
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

    await props.keycloak.groups.update({ id: groupExternalId }, { name })

    await props.redis.del(props.event.userSub + 'profile/details');

    return { id };
  },
  putGroupAssignments: async props => {

    const { appRoles, appClient, groupRoleActions, roleCall } = await props.redisProxy('appRoles', 'appClient', 'groupRoleActions', 'roleCall');

    const { assignments } = props.event.body;

    // TODO: Part of RBAC upgrade
    // Get the group external ID for now by owner
    const { externalId: groupExternalId } = await props.tx.one<IGroup>(`
      SELECT external_id FROM dbtable_schema.groups WHERE created_sub = $1
    `, [props.event.userSub]);

    await asyncForEach(Object.keys(assignments), async subgroupPath => {

      // If this is the first time roles are being added, they won't exist in the global groupRoleActions collection, so add a container for them
      if (!groupRoleActions[subgroupPath]) {
        const subgroup = (await props.keycloak.groups.findOne({ id: groupExternalId }))?.subGroups?.find(g => g.path === subgroupPath);
        if (subgroup) {
          groupRoleActions[subgroupPath] = {
            id: subgroup.id,
            fetch: true,
            actions: []
          };
        }
      }

      if (groupRoleActions[subgroupPath]) {

        const deletions = groupRoleActions[subgroupPath].actions?.filter(a => !assignments[subgroupPath].actions.map((aa: { name: string }) => aa.name)?.includes(a.name));

        if (deletions.length) {
          await props.keycloak.groups.delClientRoleMappings({
            id: groupRoleActions[subgroupPath].id as string,
            clientUniqueId: appClient.id!,
            roles: deletions as { id: string, name: string }[]
          });
        }

        const additions = assignments[subgroupPath].actions?.filter((a: { name: string }) =>
          !groupRoleActions[subgroupPath].actions.map(aa => aa.name)?.includes(a.name)
        ).map((a: { name: string }) => ({
          id: appRoles.find(ar => a.name === ar.name)?.id,
          name: a.name
        }));

        if (additions.length) {
          await props.keycloak.groups.addClientRoleMappings({
            id: groupRoleActions[subgroupPath].id as string,
            clientUniqueId: appClient.id!,
            roles: additions as { id: string, name: string }[]
          });
        }

        groupRoleActions[subgroupPath].fetch = true;

      }
    });

    // Get client sessions to
    const sessions = await props.keycloak.clients.listSessions({
      id: appClient.id as string
    });

    // Assign APP_ROLE_CALL to group users
    const users = await props.tx.manyOrNone<IUserProfile>(`
      SELECT eu.sub
      FROM dbview_schema.enabled_groups eg
      JOIN dbtable_schema.groups g ON g.id = eg.id
      LEFT JOIN dbview_schema.enabled_group_users egu ON egu."groupId" = eg.id
      LEFT JOIN dbview_schema.enabled_users eu ON eu.id = egu."userId"
      WHERE g.external_id = $1 AND eu.sub = ANY($2::uuid[])
    `, [groupExternalId, sessions.map(u => u.userId)]);


    const updates = users.flatMap(user => {
      return [
        props.keycloak.users.addClientRoleMappings({
          id: user.sub,
          clientUniqueId: appClient.id!,
          roles: roleCall
        }),
        props.redis.del(user.sub + 'profile/details')
      ];
    });

    await Promise.all(updates);

    await props.keycloak.regroup(groupExternalId);

    return { success: true };
  },
  getGroupAssignments: async props => {
    const { groupRoleActions } = await props.redisProxy('groupRoleActions');

    // Get the group external ID for now by owner -- as opposed to other leaders
    const { externalId } = await props.db.one<IGroup>(`
      SELECT external_id as "externalId" FROM dbtable_schema.groups WHERE created_sub = $1::uuid
    `, [props.event.userSub]);

    const assignments = (await props.keycloak.groups.findOne({ id: externalId }))?.subGroups?.reduce((m, sg) => ({ ...m, [sg.path as string]: groupRoleActions[sg.path as string] }), {}) as Record<string, IGroupRoleAuthActions>;

    return assignments;
  },
  deleteGroup: async props => {
    const { ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');

    await asyncForEach(idsSplit, async id => {

      const { externalId } = await props.tx.one<IGroup>(`
        SELECT external_id as "externalId"
        FROM dbtable_schema.groups
        WHERE id = $1 
      `, [id]);

      await props.keycloak.groups.del({ id: externalId });

      // Delete roles assigned to the group
      await props.tx.none(`
        DELETE FROM dbtable_schema.group_roles
        WHERE group_id = $1
      `, [id]);

      // Delete group
      await props.tx.none(`
        DELETE FROM dbtable_schema.groups
        WHERE id = $1
      `, [id]);
    });

    await props.redis.del(props.event.userSub + 'profile/details');

    return idsSplit.map(id => ({ id }));
  },
  checkGroupName: async props => {
    const { name } = props.event.pathParameters;

    // if (true === (await props.ai.useAi<boolean>(undefined, name.replaceAll('_', ' '))).flagged) {
    //   props.logger.log('moderation failure event', props.event.requestId);
    //   throw { reason: 'Moderation event flagged. Please revise the group name.' };
    // }

    const { count } = await props.db.one<{ count: string }>(`
      SELECT COUNT(*) as count
      FROM dbtable_schema.groups
      WHERE name = $1
    `, [name]);

    if (parseInt(count)) {
      throw { reason: 'Group name in use.' };
    }

    return { isValid: true };
  },
  inviteGroupUser: async props => {
    const { users } = props.event.body;

    for (const userId in users) {
      const { email } = users[userId];

      try {
        // const { id: keycloakUserId } = await props.keycloak.users.create({
        //   email,
        //   username: email,
        //   enabled: true,
        //   requiredActions: ['UPDATE_PASSWORD', 'UPDATE_PROFILE', 'VERIFY_EMAIL']
        // });

        // await props.keycloak.users.sendVerifyEmail({ id: keycloakUserId });
      } catch (error) {
        console.log('Invite Failure', error);
      }
    }

    return { users };
  },
  joinGroup: async props => {
    try {
      const { code } = props.event.body;

      // Get group id and default role based on the group code
      try {
        
        const { id: groupId, allowedDomains, defaultRoleId } = await props.tx.one<IGroup>(`
          SELECT id, allowed_domains as "allowedDomains", default_role_id as "defaultRoleId"
          FROM dbtable_schema.groups WHERE code = $1
        `, [code]);
  
        // Get joining user's id
        const { id: userId, email } = await props.tx.one<IUserProfile>(`
          SELECT id, email FROM dbtable_schema.users WHERE sub = $1
        `, [props.event.userSub]);
  
        if (allowedDomains && !allowedDomains.split(',').includes(email.split('@')[1])) {
          throw { reason: 'Group access is restricted.'}
        }
  
        // Get the role's subgroup external id
        const { externalId: kcRoleSubgroupExternalId } = await props.tx.one<IGroupRole>(`
          SELECT external_id as "externalId"
          FROM dbtable_schema.group_roles
          WHERE group_id = $1 AND role_id = $2
        `, [groupId, defaultRoleId]);
  
        // Add the joining user to the group in the app db
        await props.tx.none(`
          INSERT INTO dbtable_schema.group_users (user_id, group_id, external_id, created_sub)
          VALUES ($1, $2, $3, $4::uuid);
        `, [userId, groupId, kcRoleSubgroupExternalId, props.event.userSub]);
  
        return { success: true };
      } catch (error) {
        const { received } = error as DbError;
        if (!received) {
          throw { reason: 'Group not found.' }
        }

        throw error;
      }
    } catch (error) {
      const { constraint } = error as DbError;

      if ('group_users_user_id_group_id_key' === constraint) {
        throw { reason: 'You already belong to this group.' }
      }
      
      throw error;
    }
  },
  leaveGroup: async props => {
    const { code } = props.event.body;

    // Get group id and default role based on the group code
    const { id: groupId, name, externalId: kcGroupExternalId } = await props.tx.one<IGroup>(`
      SELECT id, name, external_id as "externalId"
      FROM dbtable_schema.groups WHERE code = $1
    `, [code]);

    // Get the leaving user's id
    const { id: userId } = await props.tx.one<IUserProfile>(`
      SELECT id FROM dbtable_schema.users WHERE sub = $1
    `, [props.event.userSub]);

    // Remove the leaving user from the group in the app db
    await props.tx.none(`
      DELETE FROM dbtable_schema.group_users
      WHERE user_id = $1 AND group_id = $2;
    `, [userId, groupId]);

    const userCodeGroups = (await props.keycloak.users.listGroups({ id: props.event.userSub })).filter(ug => ug.path?.split('/')[1] === name);
    
    for (const ucg of userCodeGroups) {
      if (ucg.id) {
        await props.keycloak.users.delFromGroup({ id: props.event.userSub, groupId: ucg.id })
      }
    }

    // Refresh redis cache of group users/roles
    await props.keycloak.regroup(kcGroupExternalId);
    
    await props.redis.del(props.event.userSub + 'profile/details');

    return { success: true };
  },
  attachUser: async props => {
    const { code } = props.event.body;

    // Get group id and default role based on the group code
    const { id: groupId, externalId: kcGroupExternalId, defaultRoleId, createdSub } = await props.tx.one<IGroup>(`
      SELECT id, external_id as "externalId", default_role_id as "defaultRoleId", created_sub as "createdSub"
      FROM dbtable_schema.groups WHERE code = $1
    `, [code]);

    // Get the role's subgroup external id
    const { externalId: kcRoleSubgroupExternalId } = await props.tx.one<IGroupRole>(`
      SELECT external_id as "externalId"
      FROM dbtable_schema.group_roles
      WHERE group_id = $1 AND role_id = $2
    `, [groupId, defaultRoleId]);

    // Attach the user to the role's subgroup in keycloak
    await props.keycloak.users.addToGroup({
      id: props.event.userSub,
      groupId: kcRoleSubgroupExternalId
    });

    // Attach role call so the joining member's roles update
    const { appClient, roleCall } = await props.redisProxy('appClient', 'roleCall');
    await props.keycloak.users.addClientRoleMappings({
      id: props.event.userSub,
      clientUniqueId: appClient.id!,
      roles: roleCall
    });

    // Refresh redis cache of group users/roles
    await props.keycloak.regroup(kcGroupExternalId);
      
    await props.redis.del(props.event.userSub + 'profile/details');
    await props.redis.del(createdSub + 'profile/details');

    return { success: true };
  }

});