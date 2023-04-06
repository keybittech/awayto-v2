import { v4 as uuid } from 'uuid';
import { asyncForEach, Extend, Void } from '../util';
import { ApiHandler, ApiInternalError, ApiOptions, buildUpdate, DbError, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { IPrompts } from './assist';
import { IGroupRole } from './group_role';
import { IUserProfile } from './profile';
import { IRole } from './role';
import { utcNowString } from './time_unit';

/**
 * @category Authorization
 */
export type IGroupRoleAuthActions = {
  id?: string;
  fetch?: boolean;
  actions: {
    id?: string;
    name: string;
  }[];
}

/**
 * @category Authorization
 */
export type IGroupRoleActionState = {
  assignments: Record<string, IGroupRoleAuthActions>;
};

/**
 * @category Group
 */
export type IGroup = {
  id: string;
  externalId: string;
  createdSub: string;
  createdOn: string;
  defaultRoleId: string;
  allowedDomains: string;
  name: string;
  purpose: string;
  code: string;
  usersCount: number;
  roles: Record<string, IRole>;
  users: Record<string, IUserProfile>;
  availableGroupAssignments: Record<string, IGroupRoleAuthActions>;

  isValid: boolean;
  needCheckName: boolean;
  checkingName: boolean;
  checkedName: string;
  error: Error | string;
}

/**
 * @category Group
 */
const groupApi = {
  postGroup: {
    kind: EndpointType.MUTATION,
    url: 'group',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: {
      name: '' as string,
      purpose: '' as string,
      roles: {} as Record<string, IRole>,
      allowedDomains: '' as string,
      defaultRoleId: '' as string,
    },
    resultType: [] as { id: string; name: string; roles: Record<string, { name: string }> }[]
  },
  putGroup: {
    kind: EndpointType.MUTATION,
    url: 'group',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {
      id: '' as string,
      name: '' as string,
      roles: {} as Record<string, IRole>,
      allowedDomains: '' as string,
      defaultRoleId: '' as string,
    },
    resultType: [] as IGroup[]
  },
  putGroupAssignments: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/assignments',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {
      groupName: '' as string,
      assignments: {} as Record<string, { actions: { name: string }[] }>,
    },
    resultType: {} as Void
  },
  getGroups: {
    kind: EndpointType.QUERY,
    url: 'group',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IGroup[]
  },
  getGroupAssignments: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/assignments',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string },
    resultType: {} as Record<string, IGroupRoleAuthActions>
  },
  getGroupById: {
    kind: EndpointType.QUERY,
    url: 'group/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IGroup
  },
  deleteGroup: {
    kind: EndpointType.MUTATION,
    url: 'group',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { ids: '' as string },
    resultType: [] as { id: string }[]
  },
  checkGroupName: {
    kind: EndpointType.QUERY,
    url: 'group/valid/:name',
    method: 'GET',
    opts: { cache: null } as ApiOptions,
    queryArg: { name: '' as string },
    resultType: { isValid: true as boolean }
  },
  inviteGroupUser: {
    kind: EndpointType.MUTATION,
    url: 'group/users/invite',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { users: [] as { email: string }[] },
    resultType: { users: [] as { email: string }[] }
  },
  joinGroup: {
    kind: EndpointType.MUTATION,
    url: 'group/join/:code',
    method: 'POST',
    opts: { cache: 'skip' } as ApiOptions,
    queryArg: { code: '' as string },
    resultType: true
  },
  leaveGroup: {
    kind: EndpointType.MUTATION,
    url: 'group/leave/:code',
    method: 'POST',
    opts: { cache: 'skip' } as ApiOptions,
    queryArg: { code: '' as string },
    resultType: true
  }
} as const;


const groupApiHandlers: ApiHandler<typeof groupApi> = {
  postGroup: async props => {
    try {
      const { name, purpose, roles, allowedDomains, defaultRoleId } = props.event.body;

      // Do this first for now to check if user already made a group
      // Create a group in app db if user has no groups and name is unique
      const group = await props.tx.one<IGroup>(`
        INSERT INTO dbtable_schema.groups (external_id, code, admin_external_id, default_role_id, name, purpose, allowed_domains, created_sub)
        VALUES ($1, $2, $3, $4::uuid, $5, $6, $7, $8::uuid)
        RETURNING id, name
      `, [props.event.userSub, props.event.userSub, props.event.userSub, defaultRoleId, name, props.event.userSub, allowedDomains, props.event.userSub]);

      let kcGroupExternalId = '';

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

      if (true === await props.completions.getModerationCompletion(purpose)) {
        props.logger.log('moderation failure event', props.event.requestId);
        throw { reason: 'Moderation event flagged. Please revise the group purpose.' };
      }

      const convertPurpose = props.completions.generatePrompt(IPrompts.CONVERT_PURPOSE, name, purpose);
      const convertedPurpose = await props.completions.getChatCompletionPrompt(convertPurpose);
      const purposeMission = convertedPurpose.toLowerCase().replaceAll('"', '').replaceAll('.', '');

      const { groupAdminRoles, appClient, roleCall } = await props.redisProxy('groupAdminRoles', 'appClient', 'roleCall');

      await props.tx.none(`
        INSERT INTO dbtable_schema.users (sub, username, created_on, created_sub)
        VALUES ($1::uuid, $2, $3, $1::uuid)
      `, [uuid(), 'system_group_' + name, new Date()]);

      // Create an Admin subgroup in keycloak for this group
      const { id: kcAdminSubgroupExternalId } = await props.keycloak.groups.setOrCreateChild({ id: kcGroupExternalId }, { name: 'Admin' });

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
      for (const roleId in roles) {
        const { name: roleName } = roles[roleId];
        if (name.toLowerCase() === 'admin') continue;
        const { id: kcSubgroupId } = await props.keycloak.groups.setOrCreateChild({ id: kcGroupExternalId }, { name: roleName });
        await props.tx.none(`
          INSERT INTO dbtable_schema.group_roles (group_id, role_id, external_id, created_on, created_sub)
          VALUES ($1, $2, $3, $4, $5::uuid)
          ON CONFLICT (group_id, role_id) DO NOTHING
        `, [group.id, roleId, kcSubgroupId, utcNowString(), props.event.userSub]);
      }

      // Get the group admin's id
      const { id: userId } = await props.tx.one<IUserProfile>(`
        SELECT id FROM dbview_schema.enabled_users WHERE sub = $1
      `, [props.event.userSub]);

      // Attach the group admin to the group in the app db
      await props.tx.none(`
        INSERT INTO dbtable_schema.group_users (user_id, group_id, external_id, created_sub)
        VALUES ($1, $2, $3, $4::uuid)
        ON CONFLICT (user_id, group_id) DO NOTHING
        RETURNING id
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

      return [{ ...group, roles }];

    } catch (error) {
      const { constraint } = error as DbError;

      if ('unique_group_owner' === constraint) {
        throw { reason: 'Only 1 group can be managed at a time.' }
      }

      throw error;
    }
  },
  putGroup: async props => {
    const { id, name, roles, defaultRoleId } = props.event.body;

    const updateProps = buildUpdate({
      id,
      name,
      default_role_id: defaultRoleId,
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });

    // Update the basic info about the group in the app DB
    const group = await props.tx.one<IGroup>(`
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
      const externalGroup = await props.keycloak.groups.findOne({ id: group.externalId });
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
      const { id: kcSubgroupId } = await props.keycloak.groups.setOrCreateChild({ id: group.externalId }, { name: role.name });
      await props.tx.none(`
        INSERT INTO dbtable_schema.group_roles (group_id, role_id, external_id, created_on, created_sub)
        VALUES ($1, $2, $3, $4, $5::uuid)
        ON CONFLICT (group_id, role_id) DO NOTHING
      `, [group.id, role.id, kcSubgroupId, utcNowString(), props.event.userSub]);
    }

    await props.redis.del(props.event.userSub + 'profile/details');

    return [{ ...group, roles }];
  },
  putGroupAssignments: async props => {

    const { appRoles, appClient, groupRoleActions, roleCall } = await props.redisProxy('appRoles', 'appClient', 'groupRoleActions', 'roleCall');

    const { assignments } = props.event.body;

    // Get the group external ID for now by owner
    const { externalId: groupExternalId } = await props.tx.one<IGroup>(`
      SELECT "externalId" FROM dbview_schema.enabled_groups WHERE "createdSub" = $1
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
      FROM dbview_schema.enabled_groups g
      LEFT JOIN dbview_schema.enabled_group_users egu ON egu."groupId" = g.id
      LEFT JOIN dbview_schema.enabled_users eu ON eu.id = egu."userId"
      WHERE g."externalId" = $1 AND eu.sub = ANY($2::uuid[])
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
  },
  getGroups: async props => {
    const groups = await props.db.manyOrNone<IGroup>(`
      SELECT * FROM dbview_schema.enabled_groups_ext
      WHERE "createdSub" = $1
    `, [props.event.userSub]);

    return groups;
  },
  getGroupAssignments: async props => {
    const { groupRoleActions } = await props.redisProxy('groupRoleActions');

    // Get the group external ID for now by owner
    const { externalId } = await props.db.one<IGroup>(`
      SELECT "externalId" FROM dbview_schema.enabled_groups WHERE "createdSub" = $1
    `, [props.event.userSub]);

    const assignments = (await props.keycloak.groups.findOne({ id: externalId }))?.subGroups?.reduce((m, sg) => ({ ...m, [sg.path as string]: groupRoleActions[sg.path as string] }), {}) as Record<string, IGroupRoleAuthActions>;

    return assignments;
  },
  getGroupById: async props => {
    const { id } = props.event.pathParameters;

    const group = await props.db.one<IGroup>(`
      SELECT * FROM dbview_schema.enabled_groups_ext
      WHERE id = $1
    `, [id]);

    return group;
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
    })

    await props.redis.del(props.event.userSub + 'profile/details');

    return idsSplit.map(id => ({ id }));
  },
  checkGroupName: async props => {
    const { name } = props.event.pathParameters;

    if (true === await props.completions.getModerationCompletion(name.replaceAll('_', ' '))) {
      props.logger.log('moderation failure event', props.event.requestId);
      throw { reason: 'Moderation event flagged. Please revise the group name.' };
    }

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
        const { id: keycloakUserId } = await props.keycloak.users.create({
          email,
          username: email,
          enabled: true,
          requiredActions: ['UPDATE_PASSWORD', 'UPDATE_PROFILE', 'VERIFY_EMAIL']
        });

        await props.keycloak.users.sendVerifyEmail({ id: keycloakUserId });
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
      const { id: groupId, allowedDomains, externalId: kcGroupExternalId, defaultRoleId, createdSub } = await props.db.one<IGroup>(`
        SELECT id, allowed_domains as "allowedDomains", external_id as "externalId", default_role_id as "defaultRoleId", created_sub as "createdSub"
        FROM dbtable_schema.groups WHERE code = $1
      `, [code]);

      // Get joining user's id
      const { id: userId, username } = await props.tx.one<IUserProfile>(`
        SELECT id, username FROM dbtable_schema.users WHERE sub = $1
      `, [props.event.userSub]);

      if (allowedDomains && !allowedDomains.split(',').includes(username.split('@')[1])) {
        throw { reason: 'Group access is restricted.'}
      }

      // Get the role's subgroup external id
      const { externalId: kcRoleSubgroupExternalId } = await props.tx.one<IGroupRole>(`
        SELECT "externalId"
        FROM dbview_schema.enabled_group_roles
        WHERE "groupId" = $1 AND "roleId" = $2
      `, [groupId, defaultRoleId]);

      // Add the joining user to the group in the app db
      await props.tx.none(`
        INSERT INTO dbtable_schema.group_users (user_id, group_id, external_id, created_sub)
        VALUES ($1, $2, $3, $4::uuid);
      `, [userId, groupId, kcRoleSubgroupExternalId, props.event.userSub]);

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

      return true;
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

    return true;
  }

} as const;

/**
 * @category Group
 */
type GroupsApi = typeof groupApi;

/**
 * @category Group
 */
type GroupsApiHandler = typeof groupApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<GroupsApi> { }
  interface SiteApiHandlerRef extends Extend<GroupsApiHandler> { }
}

Object.assign(siteApiRef, groupApi);
Object.assign(siteApiHandlerRef, groupApiHandlers);