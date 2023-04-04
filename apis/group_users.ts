import { asyncForEach, IGroup, IGroupUser, IGroupUserActionTypes, IGroupService, IGroupRole, ApiErrorResponse } from 'awayto/core';
import { redisProxy } from '../util/redis';
import { ApiModule } from '../api';
import { keycloak, regroup } from '../util/keycloak';

const groupUsers: ApiModule = [

  {
    action: IGroupUserActionTypes.POST_GROUP_USER,
    cmnd: async (props) => {
      try {

        return true;

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IGroupUserActionTypes.PUT_GROUP_USER,
    cmnd: async (props) => {
      try {
        const { roleCall, appClient } = await redisProxy('roleCall', 'appClient');

        const { groupName } = props.event.pathParameters;
        const { userId, roleId, roleName } = props.event.body;

        // Get the user's current role subgroup external id
        const { rows: [{ externalId: kcOldSubgroupExternalId, groupExternalId, groupId, userSub }] } = await props.db.query<IGroupUser>(`
          SELECT g.external_id as "groupExternalId", gu.external_id as "externalId", gu.group_id as "groupId", u.sub as "userSub"
          FROM dbtable_schema.group_users gu
          JOIN dbtable_schema.users u ON u.id = gu.user_id
          JOIN dbtable_schema.groups g ON g.id = gu.group_id
          WHERE g.name = $1 AND gu.user_id = $2
        `, [groupName, userId]);

        // Get the new role's subgroup external id
        const { rows: [{ externalId: kcNewSubgroupExternalId }] } = await props.db.query<IGroupRole>(`
          SELECT external_id as "externalId"
          FROM dbtable_schema.group_roles
          WHERE group_id = $1 AND role_id = $2
        `, [groupId, roleId]);

        await keycloak.users.delFromGroup({ id: userSub, groupId: kcOldSubgroupExternalId });
        await keycloak.users.addToGroup({ id: userSub, groupId: kcNewSubgroupExternalId });

        await props.db.query(`
          UPDATE dbtable_schema.group_users
          SET external_id = $3
          WHERE group_id = $1 AND user_id = $2
        `, [groupId, userId, kcNewSubgroupExternalId]);

        // Attach role call so the group admin's roles force update
        await keycloak.users.addClientRoleMappings({
          id: userSub,
          clientUniqueId: appClient.id!,
          roles: roleCall
        });

        await regroup(groupExternalId);

        await props.redis.del(`${userSub}profile/details`);

        await props.redis.del(`${props.event.userSub}group/${groupName}/users`);
        await props.redis.del(`${props.event.userSub}group/${groupName}/users/${userId}`);

        return [{ id: userId, roleId, roleName }];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IGroupUserActionTypes.GET_GROUP_USERS,
    cmnd: async (props) => {
      try {
        const { groupName } = props.event.pathParameters;

        const [{ id: groupId }] = (await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName])).rows

        const response = await props.db.query<IGroupUser>(`
          SELECT eu.*, er.id as "roleId", er.name as "roleName"
          FROM dbview_schema.enabled_group_users egu
          LEFT JOIN dbview_schema.enabled_users eu ON eu.id = egu."userId"
          JOIN dbview_schema.enabled_group_roles egr ON egr."externalId" = egu."externalId"
          JOIN dbview_schema.enabled_roles er ON er.id = egr."roleId"
          WHERE egu."groupId" = $1
        `, [groupId]);

        return response.rows;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupUserActionTypes.GET_GROUP_USER_BY_ID,
    cmnd: async (props) => {
      try {
        const { groupName, userId } = props.event.pathParameters;

        const { rows: [{ id: groupId }] } = await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName]);
        
        const response = await props.db.query<IGroupUser>(`
          SELECT
            eu.id,
            egu."groupId",
            egu."userId",
            egu."externalId",
            eu."firstName",
            eu."lastName",
            eu.username,
            eu.locked,
            eu.image,
            eu.email,
            er.id as "roleId",
            er.name as "roleName"
          FROM dbview_schema.enabled_group_users egu
          JOIN dbview_schema.enabled_users eu ON eu.id = egu."userId"
          JOIN dbview_schema.enabled_group_roles egr ON egr."externalId" = egu."externalId"
          JOIN dbview_schema.enabled_roles er ON er.id = egr."roleId"
          WHERE egu."groupId" = $1 and egu."userId" = $2
        `, [groupId, userId]);

        return response.rows;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupUserActionTypes.DELETE_GROUP_USER,
    cmnd: async (props) => {
      try {

        const { groupName, ids } = props.event.pathParameters;
        const idsSplit = ids.split(',');

        const { rows: [{ id: groupId }] } = await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName]);

        await asyncForEach(idsSplit, async userId => {
          // Detach user from group
          await props.db.query<IGroupService>(`
            DELETE FROM dbtable_schema.group_users
            WHERE group_id = $1 AND user_id = $2
          `, [groupId, userId]);

          // Add role call and force role change
        });

        await props.redis.del(props.event.userSub + `group/${groupName}/users`);

        return idsSplit.map(id => ({ id }));
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupUserActionTypes.LOCK_GROUP_USER,
    cmnd: async (props) => {
      try {

        const { groupName, ids } = props.event.pathParameters;
        const idsSplit = ids.split(',');

        const { rows: [{ id: groupId }] } = await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName]);

        await asyncForEach(idsSplit, async userId => {
          // Detach user from group
          await props.db.query<IGroupService>(`
            DELETE FROM dbtable_schema.group_users
            WHERE group_id = $1 AND user_id = $2
          `, [groupId, userId]);

          // Add role call and force role change
        });

        await props.redis.del(props.event.userSub + `group/${groupName}/users`);

        return idsSplit.map(id => ({ id }));
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IGroupUserActionTypes.UNLOCK_GROUP_USER,
    cmnd: async (props) => {
      try {

        const { groupName, ids } = props.event.pathParameters;
        const idsSplit = ids.split(',');

        const { rows: [{ id: groupId }] } = await props.db.query<IGroup>(`
          SELECT id
          FROM dbview_schema.enabled_groups
          WHERE name = $1
        `, [groupName]);

        await asyncForEach(idsSplit, async userId => {
          // Detach user from group
          await props.db.query<IGroupService>(`
            DELETE FROM dbtable_schema.group_users
            WHERE group_id = $1 AND user_id = $2
          `, [groupId, userId]);

          // Add role call and force role change
        });

        await props.redis.del(props.event.userSub + `group/${groupName}/users`);

        return idsSplit.map(id => ({ id }));
      } catch (error) {
        throw error;
      }

    }
  }
]

export default groupUsers;