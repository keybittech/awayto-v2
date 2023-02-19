import { IGroup, IUuidRoles, DbError, IUserProfile, IGroupState, IRole, IGroupRoleActions, IGroupActionTypes } from 'awayto';
import { asyncForEach } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';
import { performance } from 'perf_hooks';

import { keycloak, appClient, appRoles, groupAdminRoles, groupRoleActions, regroup, roleCall } from '../util/keycloak';

const groups: ApiModule = [

  {
    action: IGroupActionTypes.POST_GROUPS,
    cmnd: async (props) => {

      try {

        const { name, roles, roleId: adminRoleId } = props.event.body as IGroup;
        let primaryRoleSubgroupId = '';

        // Create a group in app db if user has no groups and name is unique
        const { rows: [group] } = await props.db.query<IGroup>(`
          INSERT INTO groups (external_id, code, role_id, name, created_sub)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (name) DO NOTHING
          RETURNING id, name, created_sub
        `, [props.event.userSub, props.event.userSub, adminRoleId, name, props.event.userSub]);

        // Create a keycloak group if the previous operation was allowed
        const { id: externalId } = await keycloak.groups.create({ name });

        // Update the group with keycloak reference id
        await props.db.query(`UPDATE groups SET external_id = $1 WHERE id = $2`, [externalId, group.id]);

        // For each group role, create a keycloak subgroup and attach to group uuid
        await asyncForEach(roles, async ({ id: groupRoleId, name }) => {

          const { id: kcSubgroupId } = await keycloak.groups.setOrCreateChild({ id: externalId }, { name });

          // If this is the admin role, attach the core roles
          if (groupRoleId === adminRoleId) {
            primaryRoleSubgroupId = kcSubgroupId;

            const res = await keycloak.groups.addClientRoleMappings({
              id: primaryRoleSubgroupId,
              clientUniqueId: appClient.id!,
              roles: groupAdminRoles as { id: string, name: string }[]
            });
          }

          await props.db.query(`
            INSERT INTO uuid_roles (parent_uuid, role_id, external_id, created_on, created_sub)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (parent_uuid, role_id) DO NOTHING
          `, [group.id, groupRoleId, kcSubgroupId, new Date(), props.event.userSub])
        });

        // Get the user uuid from the sub
        const { rows: [{ id: userId }] } = await props.db.query<IUserProfile>(`
          SELECT id FROM dbview_schema.enabled_users WHERE sub = $1
        `, [props.event.userSub]);

        // Attach the user to the group in the app db
        await props.db.query(`
          INSERT INTO uuid_groups (parent_uuid, group_id, created_sub)
          VALUES ($1, $2, $3)
          ON CONFLICT (parent_uuid, group_id) DO NOTHING
          RETURNING id
        `, [userId, group.id, props.event.userSub]);

        // Attach the user to the primary role subgroup and add ROLE_CALL

        await keycloak.users.addToGroup({
          id: props.event.userSub,
          groupId: primaryRoleSubgroupId
        });

        await keycloak.users.addClientRoleMappings({
          id: props.event.userSub,
          clientUniqueId: appClient.id!,
          roles: roleCall
        });

        await regroup(externalId);

        group.roles = roles;

        return [group];

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
        const { id, name, roles, roleId: adminRoleId } = props.event.body as IGroup;

        const updateProps = buildUpdate({ id, name });

        // Update the basic info about the group
        const { rows: [group] } = await props.db.query<IGroup>(`
          UPDATE groups
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, name, external_id as "externalId", role_id as "roleId"
        `, updateProps.array);

        // See if any roles have changed
        const roleIds = roles.map(r => r.id);
        const diffs = (await props.db.query<IUuidRoles>(`
          SELECT id, "roleId" 
          FROM dbview_schema.enabled_uuid_roles 
          WHERE "parentUuid" = $1
        `, [group.id])).rows.filter(r => !roleIds.includes(r.roleId));

        if (diffs.length) {

          // Remove any old roles from app db
          await Promise.all(diffs.map(d => {
            if (d.id) {
              return props.db.query('DELETE FROM uuid_roles WHERE id = $1', [d.id]);
            }
          }));

          // Delete keycloak subgroups under the parent group which are no longer present
          const externalGroup = await keycloak.groups.findOne({ id: group.externalId });
          if (externalGroup?.subGroups) {
            const roleNames = (await props.db.query<IRole>(`SELECT name FROM dbview_schema.enabled_roles WHERE id = ANY($1::uuid[])`, [diffs.map(r => r.roleId)])).rows.map(r => r.name);
            await asyncForEach(externalGroup?.subGroups.filter(sg => roleNames.indexOf(sg.name as string) > -1), async subGroup => {
              if (subGroup.id) {
                await keycloak.groups.del({ id: subGroup.id });
              }
            });
          }
        }


        await asyncForEach(roles, async role => {
          await keycloak.groups.setOrCreateChild({ id: group.externalId }, { name: role.name });
          await props.db.query(`
            INSERT INTO uuid_roles (parent_uuid, role_id, created_on, created_sub)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (parent_uuid, role_id) DO NOTHING
          `, [group.id, role.id, new Date(), props.event.userSub])
        })


        // If the admin role has changed
        if (group.roleId !== adminRoleId) {
          
          // If the keycloak subgroup didn't get deleted earlier
          if (!diffs.filter(d => d.roleId === group.roleId).length) {
            const [{ externalId: oldAdminRoleExternalSubgroupId }] = (await props.db.query<IUuidRoles>(`
              SELECT "externalId" FROM dbview_schema.enabled_uuid_roles WHERE "roleId" = $1
            `, [group.roleId])).rows;

            await keycloak.groups.delClientRoleMappings({
              id: oldAdminRoleExternalSubgroupId,
              clientUniqueId: appClient.id!,
              roles: groupAdminRoles as { id: string, name: string }[]
            });
          }
          
          // Get the new admin role's externalId for its keycloak subgroup
          const [{ externalId: newAdminRoleExternalSubgroupId }] = (await props.db.query<IUuidRoles>(`
            SELECT "externalId" FROM dbview_schema.enabled_uuid_roles WHERE "roleId" = $1
          `, [adminRoleId])).rows;

          // Set the new admin role for the group
          await props.db.query(`UPDATE groups SET role_id = $1 WHERE id = $2`, [adminRoleId, group.id]);
          group.roleId = adminRoleId;

          // Attach keycloak roles to the new admin role subgroup
          await keycloak.groups.addClientRoleMappings({
            id: newAdminRoleExternalSubgroupId,
            clientUniqueId: appClient.id!,
            roles: groupAdminRoles as { id: string, name: string }[]
          });

          // Attach the user to the primary role subgroup
          await keycloak.users.addToGroup({
            id: props.event.userSub,
            groupId: newAdminRoleExternalSubgroupId
          });
        }

        group.roles = roles;

        return [group];

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupActionTypes.PUT_GROUPS_ASSIGNMENTS,
    cmnd: async (props) => {

      performance.mark("putGroupAssignmentsStart");
      
      // const { groupName } = props.event.pathParameters;
      const { assignments } = props.event.body as { assignments: IGroupRoleActions };

      // Get the group external ID for now by owner
      const [{ externalId }] = (await props.db.query<IGroup>(`
        SELECT "externalId" FROM dbview_schema.enabled_groups WHERE "createdSub" = $1
      `, [props.event.userSub])).rows;

      await asyncForEach(Object.keys(assignments), async subgroupPath => {

        // If this is the first time roles are being added, they won't exist in the global groupRoleActions collection, so add a container for them
        if (!groupRoleActions[subgroupPath]) {
          const subgroup = (await keycloak.groups.findOne({ id: externalId }))?.subGroups?.find(g => g.path === subgroupPath);
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
      const [sessions] = await Promise.all([
        keycloak.clients.listSessions({
          id: appClient.id as string
        }),
        regroup(externalId)
      ]);

      // Assign APP_ROLE_CALL to group users
      const users = (await props.db.query<IUserProfile>(`
        SELECT eu.sub
        FROM dbview_schema.enabled_groups g
        LEFT JOIN dbview_schema.enabled_uuid_groups eug ON eug."groupId" = g.id
        LEFT JOIN dbview_schema.enabled_users eu ON eu.id = eug."parentUuid"
        WHERE g."externalId" = $1 AND eu.sub = ANY($2::varchar[])
      `, [externalId, sessions.map(u => u.userId)])).rows;


      await Promise.all(users.map(user => {
        return keycloak.users.addClientRoleMappings({
          id: user.sub,
          clientUniqueId: appClient.id!,
          roles: roleCall
        });
      }));

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
            FROM groups
            WHERE id = $1 
          `, [id]);

          await keycloak.groups.del({ id: externalId });

          // Delete roles assigned to the group
          await props.db.query(`
            DELETE FROM uuid_roles
            WHERE parent_uuid = $1
          `, [id]);

          // Delete group
          await props.db.query(`
            DELETE FROM groups
            WHERE id = $1
          `, [id]);
        })

        return ids.split(',').map<Partial<IGroup>>(id => ({ id }));

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupActionTypes.DISABLE_GROUPS,
    cmnd: async (props) => {
      try {
        const groups = props.event.body as IGroup[];

        await asyncForEach(groups, async group => {
          await props.db.query(`
            UPDATE groups
            SET enabled = false
            WHERE id = $1
          `, [group.id]);
        });

        return groups;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupActionTypes.CHECK_GROUPS_NAME,
    cmnd: async (props) => {
      try {
        const { name } = props.event.pathParameters;

        const { rows: [{ count }] } = await props.db.query<{ count: number }>(`
          SELECT COUNT(*) as count
          FROM groups
          WHERE name = $1
        `, [name]);

        return { checkingName: false, isValid: count == 0 };

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupActionTypes.POST_GROUPS_USERS_INVITE,
    cmnd: async (props) => {
      const { users } = props.event.body as IGroupState;

      await asyncForEach(users, async ({ email }) => {
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
      })

      return users;
    }
  },

  {
    action: IGroupActionTypes.GROUPS_JOIN,
    cmnd: async (props) => {
      try {
        const { code } = props.event.body as IGroup;

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id FROM groups WHERE code = $1
        `, [code])).rows;

        const [{ id: userId }] = (await props.db.query<IUserProfile>(`
          SELECT id FROM users WHERE sub = $1
        `, [props.event.userSub])).rows;

        await props.db.query(`
          INSERT INTO uuid_groups (parent_uuid, group_id)
          VALUES ($1, $2);
        `, [userId, groupId]);

        return true;
      } catch (error) {
        const { constraint } = error as DbError;

        if ('uuid_groups_parent_uuid_group_id_key' === constraint) {
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
        const { code } = props.event.body as IGroup;

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id FROM groups WHERE code = $1
        `, [code])).rows;

        const [{ id: userId }] = (await props.db.query<IUserProfile>(`
          SELECT id FROM users WHERE sub = $1
        `, [props.event.userSub])).rows;

        await props.db.query(`
          DELETE FROM uuid_groups
          WHERE parent_uuid = $1 AND group_id = $2;
        `, [userId, groupId]);

        return true;
      } catch (error) {
        throw error;
      }

    }
  }

];

export default groups;