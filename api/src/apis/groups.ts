import { performance } from 'perf_hooks';
import { v4 as uuid } from 'uuid';

import { IGroup, IGroupRole, DbError, IUserProfile, IGroupState, IRole, IGroupActionTypes, asyncForEach, utcNowString, IPrompts } from 'awayto';

import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';
import { keycloak, regroup } from '../util/keycloak';
import { generatePrompt, getChatCompletionPrompt, getModerationCompletion } from '../util/openai';
import { redisProxy } from '../util/redis';
import logger from '../util/logger';


const groups: ApiModule = [

  {
    action: IGroupActionTypes.POST_GROUPS,
    cmnd: async (props) => {

      try {
        const { name, purpose, allowedDomains, defaultRoleId } = props.event.body;


        const [result] = await getModerationCompletion(purpose);

        if (result.flagged) {
          logger.log('moderation event', props.event);
          throw { reason: 'Moderation event flagged. Please revise the group purpose.' };
        }

        const convertPurpose = generatePrompt(IPrompts.CONVERT_PURPOSE, name, purpose);
        const [convertedData] = await getChatCompletionPrompt(convertPurpose);
        const purposeMission = convertedData.message?.content.toLowerCase().replaceAll('"', '').replaceAll('.', '');

        const { groupAdminRoles, appClient, roleCall } = await redisProxy('groupAdminRoles', 'appClient', 'roleCall');

        const roles = new Map<string, IRole>(Object.entries(props.event.body.roles));

        await props.db.query(`
          INSERT INTO dbtable_schema.users (sub, username, created_on, created_sub)
          VALUES ($1::uuid, $2, $3, $1::uuid)
        `, [uuid(), 'system_group_' + name, new Date()]);

        // Create a group in app db if user has no groups and name is unique
        const { rows: [group] } = await props.db.query<IGroup>(`
          INSERT INTO dbtable_schema.groups (external_id, code, admin_external_id, default_role_id, name, purpose, allowed_domains, created_sub)
          VALUES ($1, $2, $3, $4::uuid, $5, $6, $7, $8::uuid)
          ON CONFLICT (name) DO NOTHING
          RETURNING id, name
        `, [props.event.userSub, props.event.userSub, props.event.userSub, defaultRoleId, name, purposeMission, allowedDomains, props.event.userSub]);

        if (!group?.id) throw { reason: 'Could not make the group. Name in use.' }

        let kcGroupExternalId = '';

        try {
          // Create a keycloak group if the previous operation was allowed
          const { id: kcGroupId } = await keycloak.groups.create({ name });
          kcGroupExternalId = kcGroupId;
        } catch (error) {
          throw { reason: 'Could not make the group. Name in use.' }
        }

        // Create an Admin subgroup in keycloak for this group
        const { id: kcAdminSubgroupExternalId } = await keycloak.groups.setOrCreateChild({ id: kcGroupExternalId }, { name: 'Admin' });

        // Add admin roles to the admin subgroup
        await keycloak.groups.addClientRoleMappings({
          id: kcAdminSubgroupExternalId,
          clientUniqueId: appClient.id!,
          roles: groupAdminRoles as { id: string, name: string }[]
        });

        // Attach the user to the admin subgroup
        await keycloak.users.addToGroup({
          id: props.event.userSub,
          groupId: kcAdminSubgroupExternalId
        });

        // Update the group with keycloak reference id
        await props.db.query(`
          UPDATE dbtable_schema.groups 
          SET external_id = $2, admin_external_id = $3
          WHERE id = $1
        `, [group.id, kcGroupExternalId, kcAdminSubgroupExternalId]);

        // For each group role, create a keycloak subgroup and attach to group_roles
        for (const { id: roleId, name } of roles.values()) {
          if (name.toLowerCase() === 'admin') continue;
          const { id: kcSubgroupId } = await keycloak.groups.setOrCreateChild({ id: kcGroupExternalId }, { name });
          await props.db.query(`
            INSERT INTO dbtable_schema.group_roles (group_id, role_id, external_id, created_on, created_sub)
            VALUES ($1, $2, $3, $4, $5::uuid)
            ON CONFLICT (group_id, role_id) DO NOTHING
          `, [group.id, roleId, kcSubgroupId, utcNowString(), props.event.userSub]);
        }

        // Get the group admin's id
        const { rows: [{ id: userId }] } = await props.db.query<IUserProfile>(`
          SELECT id FROM dbview_schema.enabled_users WHERE sub = $1
        `, [props.event.userSub]);

        // Attach the group admin to the group in the app db
        await props.db.query(`
          INSERT INTO dbtable_schema.group_users (user_id, group_id, external_id, created_sub)
          VALUES ($1, $2, $3, $4::uuid)
          ON CONFLICT (user_id, group_id) DO NOTHING
          RETURNING id
        `, [userId, group.id, kcAdminSubgroupExternalId, props.event.userSub]);

        // Attach role call so the group admin's roles force update
        await keycloak.users.addClientRoleMappings({
          id: props.event.userSub,
          clientUniqueId: appClient.id!,
          roles: roleCall
        });

        // Refresh redis cache of group users/roles
        await regroup(kcGroupExternalId);

        await props.redis.del(props.event.userSub + 'profile/details');

        return [{ ...group, roles: Array.from(roles.values()) }];

      } catch (error) {
        const { constraint } = error as DbError;

        if ('unique_group_owner' === constraint) {
          throw { reason: 'Only 1 group can be managed at a time.' }
        }

        throw error;
      }
    }
  },

  {
    action: IGroupActionTypes.PUT_GROUPS,
    cmnd: async (props) => {
      try {
        const { id, name, defaultRoleId } = props.event.body;
        const roles = new Map<string, IRole>(Object.entries(props.event.body.roles));

        const updateProps = buildUpdate({
          id,
          name,
          default_role_id: defaultRoleId,
          updated_sub: props.event.userSub,
          updated_on: utcNowString()
        });

        // Update the basic info about the group in the app DB
        const { rows: [group] } = await props.db.query<IGroup>(`
          UPDATE dbtable_schema.groups
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, name, external_id as "externalId"
        `, updateProps.array);

        // See if any roles have changed, "rolesIds"/"roles" are the new incoming roles
        const roleIds = Array.from(roles.keys());

        // Get all the group_roles by the group's id
        const diffs = (await props.db.query<IGroupRole>(`
          SELECT id, "roleId" 
          FROM dbview_schema.enabled_group_roles 
          WHERE "groupId" = $1
        `, [group.id])).rows.filter(r => !roleIds.includes(r.roleId));

        // Diffs is filtered, now unused roles
        if (diffs.length) {

          // Delete keycloak subgroups under the parent group which are no longer present
          const externalGroup = await keycloak.groups.findOne({ id: group.externalId });
          if (externalGroup?.subGroups) {
            const roleNames = (await props.db.query<IRole>(`
              SELECT name 
              FROM dbview_schema.enabled_roles 
              WHERE id = ANY($1::uuid[])
            `, [diffs.map(r => r.roleId)])).rows.map(r => r.name);
            await asyncForEach(externalGroup?.subGroups.filter(sg => roleNames.includes(sg.name as string)), async subGroup => {
              if (subGroup.id) {
                await keycloak.groups.del({ id: subGroup.id });
              }
            });
          }

          // Remove the role associations from the group
          await props.db.query(`
            DELETE FROM dbtable_schema.group_roles
            WHERE id = ANY($1::uuid[]) 
          `, [diffs.map(r => r.id)]);
        }

        // Reestablish subgroup namespaces in keycloak, and group role associations in app db
        for (const role of roles.values()) {
          const { id: kcSubgroupId } = await keycloak.groups.setOrCreateChild({ id: group.externalId }, { name: role.name });
          await props.db.query(`
            INSERT INTO dbtable_schema.group_roles (group_id, role_id, external_id, created_on, created_sub)
            VALUES ($1, $2, $3, $4, $5::uuid)
            ON CONFLICT (group_id, role_id) DO NOTHING
          `, [group.id, role.id, kcSubgroupId, utcNowString(), props.event.userSub]);
        }

        await props.redis.del(props.event.userSub + 'profile/details');

        return [{ ...group, roles: Array.from(roles.values()) }];

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupActionTypes.PUT_GROUPS_ASSIGNMENTS,
    cmnd: async (props) => {

      performance.mark("putGroupAssignmentsStart");

      const { appRoles, appClient, groupRoleActions, roleCall } = await redisProxy('appRoles', 'appClient', 'groupRoleActions', 'roleCall');

      const { assignments } = props.event.body;

      // Get the group external ID for now by owner
      const [{ externalId: groupExternalId }] = (await props.db.query<IGroup>(`
        SELECT "externalId" FROM dbview_schema.enabled_groups WHERE "createdSub" = $1
      `, [props.event.userSub])).rows;

      await asyncForEach(Object.keys(assignments), async subgroupPath => {

        // If this is the first time roles are being added, they won't exist in the global groupRoleActions collection, so add a container for them
        if (!groupRoleActions[subgroupPath]) {
          const subgroup = (await keycloak.groups.findOne({ id: groupExternalId }))?.subGroups?.find(g => g.path === subgroupPath);
          if (subgroup) {
            groupRoleActions[subgroupPath] = {
              id: subgroup.id,
              fetch: true,
              actions: []
            };
          }

        }

        if (groupRoleActions[subgroupPath]) {

          const deletions = groupRoleActions[subgroupPath].actions?.filter(a => !assignments[subgroupPath].actions.map(aa => aa.name)?.includes(a.name));

          if (deletions.length) {
            await keycloak.groups.delClientRoleMappings({
              id: groupRoleActions[subgroupPath].id as string,
              clientUniqueId: appClient.id!,
              roles: deletions as { id: string, name: string }[]
            });
          }

          const additions = assignments[subgroupPath].actions?.filter(a =>
            !groupRoleActions[subgroupPath].actions.map(aa => aa.name)?.includes(a.name)
          ).map(a => ({
            id: appRoles.find(ar => a.name === ar.name)?.id,
            name: a.name
          }));

          if (additions.length) {
            await keycloak.groups.addClientRoleMappings({
              id: groupRoleActions[subgroupPath].id as string,
              clientUniqueId: appClient.id!,
              roles: additions as { id: string, name: string }[]
            });
          }

          groupRoleActions[subgroupPath].fetch = true;

        }
      });

      // Get client sessions to
      const sessions = await keycloak.clients.listSessions({
        id: appClient.id as string
      });

      // Assign APP_ROLE_CALL to group users
      const users = (await props.db.query<IUserProfile>(`
        SELECT eu.sub
        FROM dbview_schema.enabled_groups g
        LEFT JOIN dbview_schema.enabled_group_users egu ON egu."groupId" = g.id
        LEFT JOIN dbview_schema.enabled_users eu ON eu.id = egu."userId"
        WHERE g."externalId" = $1 AND eu.sub = ANY($2::uuid[])
      `, [groupExternalId, sessions.map(u => u.userId)])).rows;


      const updates = users.flatMap(user => {
        return [
          keycloak.users.addClientRoleMappings({
            id: user.sub,
            clientUniqueId: appClient.id!,
            roles: roleCall
          }),
          props.redis.del(user.sub + 'profile/details')
        ];
      });

      await Promise.all(updates);

      await regroup(groupExternalId);

      performance.mark("putGroupAssignmentsEnd");
      performance.measure("putGroupAssignmentsStart to putGroupAssignmentsEnd", "putGroupAssignmentsStart", "putGroupAssignmentsEnd");

      return true;
    }
  },

  {
    action: IGroupActionTypes.GET_GROUPS,
    cmnd: async (props) => {
      try {

        const response = await props.db.query<IGroup>(`
          SELECT * FROM dbview_schema.enabled_groups_ext
          WHERE "createdSub" = $1
        `, [props.event.userSub]);

        return response.rows;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupActionTypes.GET_GROUPS_ASSIGNMENTS,
    cmnd: async (props) => {
      try {

        const { groupRoleActions } = await redisProxy('groupRoleActions');

        // Get the group external ID for now by owner
        const [{ externalId }] = (await props.db.query<IGroup>(`
          SELECT "externalId" FROM dbview_schema.enabled_groups WHERE "createdSub" = $1
        `, [props.event.userSub])).rows;

        const assignments = (await keycloak.groups.findOne({ id: externalId }))?.subGroups?.reduce((m, sg) => ({ ...m, [sg.path as string]: groupRoleActions[sg.path as string] }), {});

        return { availableGroupAssignments: assignments || [] } as IGroupState;
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupActionTypes.GET_GROUPS_BY_ID,
    cmnd: async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IGroup>(`
          SELECT * FROM dbview_schema.enabled_groups_ext
          WHERE id = $1
        `, [id]);

        return response.rows;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupActionTypes.DELETE_GROUPS,
    cmnd: async (props) => {
      try {

        const { ids } = props.event.pathParameters;

        await asyncForEach(ids.split(','), async id => {

          const { rows: [{ externalId }] } = await props.db.query<IGroup>(`
            SELECT external_id as "externalId"
            FROM dbtable_schema.groups
            WHERE id = $1 
          `, [id]);

          await keycloak.groups.del({ id: externalId });

          // Delete roles assigned to the group
          await props.db.query(`
            DELETE FROM dbtable_schema.group_roles
            WHERE group_id = $1
          `, [id]);

          // Delete group
          await props.db.query(`
            DELETE FROM dbtable_schema.groups
            WHERE id = $1
          `, [id]);
        })

        await props.redis.del(props.event.userSub + 'profile/details');

        return ids.split(',').map<Partial<IGroup>>(id => ({ id }));

      } catch (error) {
        throw error;
      }

    }
  },

  // {
  //   action: IGroupActionTypes.DISABLE_GROUPS,
  //   cmnd: async (props) => {
  //     try {
  //       const { groups } = props.event.body;

  //       await asyncForEach(Object.values(groups), async group => {
  //         await props.db.query(`
  //           UPDATE dbtable_schema.groups
  //           SET enabled = false, updated_on = $2, updated_sub = $3
  //           WHERE id = $1
  //         `, [group.id, utcNowString(), props.event.userSub]);
  //       });

  //       return groups;

  //     } catch (error) {
  //       throw error;
  //     }

  //   }
  // },

  {
    action: IGroupActionTypes.CHECK_GROUPS_NAME,
    cache: null,
    cmnd: async (props) => {
      try {
        const { name } = props.event.pathParameters;

        const [result] = await getModerationCompletion(name.replaceAll('_', ' '));

        if (result.flagged) {
          logger.log('moderation event', props.event);
          throw { reason: 'Moderation event flagged. Please revise the group name.', checkingName: false, isValid: false };
        }

        const { rows: [{ count }] } = await props.db.query<{ count: string }>(`
          SELECT COUNT(*) as count
          FROM dbtable_schema.groups
          WHERE name = $1
        `, [name]);

        if (parseInt(count)) {
          throw { reason: 'Group name in use.', checkingName: false, isValid: false };
        }

        return { checkingName: false, isValid: true } as IGroupState;
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupActionTypes.POST_GROUPS_USERS_INVITE,
    cmnd: async (props) => {
      const { users } = props.event.body;

      for (const { email } of users.values()) {
        try {
          const { id: userId } = await keycloak.users.create({
            email,
            username: email,
            enabled: true,
            requiredActions: ['UPDATE_PASSWORD', 'UPDATE_PROFILE', 'VERIFY_EMAIL']
          });

          await keycloak.users.sendVerifyEmail({ id: userId });
        } catch (error) {
          console.log('Invite Failure', error);
        }
      }

      return { users };
    }
  },

  {
    action: IGroupActionTypes.GROUPS_JOIN,
    cmnd: async (props) => {
      try {
        const { code } = props.event.body;

        // Get group id and default role based on the group code
        const { rows: [{ id: groupId, allowedDomains, externalId: kcGroupExternalId, defaultRoleId, createdSub }]} = await props.db.query<IGroup>(`
          SELECT id, allowed_domains as "allowedDomains", external_id as "externalId", default_role_id as "defaultRoleId", created_sub as "createdSub"
          FROM dbtable_schema.groups WHERE code = $1
        `, [code]);

        // Get joining user's id
        const [{ id: userId, username }] = (await props.db.query<IUserProfile>(`
          SELECT id, username FROM dbtable_schema.users WHERE sub = $1
        `, [props.event.userSub])).rows;

        if (allowedDomains && !allowedDomains.split(',').includes(username.split('@')[1])) {
          throw { reason: 'Group access is restricted.'}
        }

        // Get the role's subgroup external id
        const { rows: [{ externalId: kcRoleSubgroupExternalId }] } = await props.db.query<IGroupRole>(`
          SELECT "externalId"
          FROM dbview_schema.enabled_group_roles
          WHERE "groupId" = $1 AND "roleId" = $2
        `, [groupId, defaultRoleId]);

        // Add the joining user to the group in the app db
        await props.db.query(`
          INSERT INTO dbtable_schema.group_users (user_id, group_id, external_id, created_sub)
          VALUES ($1, $2, $3, $4::uuid);
        `, [userId, groupId, kcRoleSubgroupExternalId, props.event.userSub]);

        // Attach the user to the role's subgroup in keycloak
        await keycloak.users.addToGroup({
          id: props.event.userSub,
          groupId: kcRoleSubgroupExternalId
        });

        // Attach role call so the joining member's roles update
        const { appClient, roleCall } = await redisProxy('appClient', 'roleCall');
        await keycloak.users.addClientRoleMappings({
          id: props.event.userSub,
          clientUniqueId: appClient.id!,
          roles: roleCall
        });

        // Refresh redis cache of group users/roles
        await regroup(kcGroupExternalId);
        
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

    }
  },

  {
    action: IGroupActionTypes.GROUPS_LEAVE,
    cmnd: async (props) => {
      try {
        const { code } = props.event.body;

        // Get group id and default role based on the group code
        const { rows: [{ id: groupId, name, externalId: kcGroupExternalId }]} = await props.db.query<IGroup>(`
          SELECT id, name, external_id as "externalId"
          FROM dbtable_schema.groups WHERE code = $1
        `, [code]);

        // Get the leaving user's id
        const [{ id: userId }] = (await props.db.query<IUserProfile>(`
          SELECT id FROM dbtable_schema.users WHERE sub = $1
        `, [props.event.userSub])).rows;

        // Remove the leaving user from the group in the app db
        await props.db.query(`
          DELETE FROM dbtable_schema.group_users
          WHERE user_id = $1 AND group_id = $2;
        `, [userId, groupId]);

        const userCodeGroups = (await keycloak.users.listGroups({ id: props.event.userSub })).filter(ug => ug.path?.split('/')[1] === name);
        for (const ucg of userCodeGroups) {
          if (ucg.id) {
            await keycloak.users.delFromGroup({ id: props.event.userSub, groupId: ucg.id })
          }
        }

        // Refresh redis cache of group users/roles
        await regroup(kcGroupExternalId);
        
        await props.redis.del(props.event.userSub + 'profile/details');

        return true;
      } catch (error) {
        throw error;
      }

    }
  }

];

export default groups;