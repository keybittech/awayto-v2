import GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
import type { IGroup, IUuidRoles, DbError, IUserProfile, IGroupState } from 'awayto';
import { ApiModule, asyncForEach, buildUpdate } from '../util/db';

import { keycloak } from '../util/keycloak';

const groups: ApiModule = [

  {
    method: 'POST',
    path : 'groups',
    cmnd : async (props) => {
      try {

        const { name, roles } = props.event.body as IGroup;

        console.log(roles.map(({ name }) => ({ name })) as GroupRepresentation[]);

        const { id: externalId } = await keycloak.groups.create({
          name,
          subGroups: [{}] // roles.map(({ name }) => ({ name })) as GroupRepresentation[]
        });

        const { rows: [ group ] } = await props.client.query<IGroup>(`
          INSERT INTO groups (external_id, name, created_on, created_sub)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (name) DO NOTHING
          RETURNING id, name, created_sub
        `, [externalId, name, new Date(), props.event.userSub]);

        await asyncForEach(roles, async ({ id: roleId, name }) => {

          keycloak.groups.setOrCreateChild({ id: externalId }, { name });

          await props.client.query(`
            INSERT INTO uuid_roles (parent_uuid, role_id, created_on, created_sub)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (parent_uuid, role_id) DO NOTHING
          `, [group.id, roleId, new Date(), props.event.userSub])
        });
        
        const { rows: [{ id: userId }] } = await props.client.query<IUserProfile>(`
          SELECT id FROM users WHERE sub = $1
        `, [props.event.userSub]);

        await props.client.query(`
          INSERT INTO uuid_groups (parent_uuid, group_id, created_sub)
          VALUES ($1, $2, $3)
          ON CONFLICT (parent_uuid, group_id) DO NOTHING
          RETURNING id
        `, [userId, group.id, props.event.userSub]);

        group.roles = roles;
        
        return [group];

      } catch (error) {
        const { constraint } = error as DbError;
        
        if ('unique_owner' === constraint) {
          throw { reason: 'Only 1 group can be managed at a time.'}
        }

        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path : 'groups',
    cmnd : async (props) => {
      try {
        const { id, name, roles } = props.event.body as IGroup;

        const updateProps = buildUpdate({ id, name });

        const { rows: [ group ] } = await props.client.query<IGroup>(`
          UPDATE groups
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, name
        `, updateProps.array);

        const roleIds = roles.map(r => r.id);
        const diffs = (await props.client.query<IUuidRoles>(`
          SELECT id, role_id as "roleId" 
          FROM uuid_roles 
          WHERE parent_uuid = $1
        `, [group.id])).rows.filter(r => !roleIds.includes(r.roleId)).map(r => r.id) as string[];

        if (diffs.length) {
          await asyncForEach(diffs, async diff => {
            await props.client.query('DELETE FROM uuid_roles WHERE id = $1', [diff]);
          });          
        }

        await asyncForEach(roles, async role => {
          await props.client.query(`
            INSERT INTO uuid_roles (parent_uuid, role_id, created_on, created_sub)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (parent_uuid, role_id) DO NOTHING
          `, [group.id, role.id, new Date(), props.event.userSub])
        });

        group.roles = roles;

        return group;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'groups',
    cmnd : async (props) => {
      try {

        const response = await props.client.query<IGroup>(`
          SELECT * FROM enabled_groups_ext
          WHERE created_sub = $1
        `, [props.event.userSub]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'groups/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<IGroup>(`
          SELECT * FROM enabled_groups_ext
          WHERE id = $1
        `, [id]);
        
        return response.rows[0];
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'DELETE',
    path : 'groups/:ids',
    cmnd : async (props) => {
      try {

        const { ids } = props.event.pathParameters;

        await asyncForEach(ids.split(','), async id => {

          const { rows :[{ externalId }] } = await props.client.query<IGroup>(`
            SELECT external_id as "externalId"
            FROM groups
            WHERE id = $1 
          `, [id]);
      
          await keycloak.groups.del({
            id: externalId
          });

          // Delete roles assigned to the group
          await props.client.query(`
            DELETE FROM uuid_roles
            WHERE parent_uuid = $1
          `, [id]);

          // Delete group
          await props.client.query(`
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
    method: 'PUT',
    path : 'groups/disable',
    cmnd : async (props) => {
      try {
        const groups = props.event.body as IGroup[];

        await asyncForEach(groups, async group => {
          await props.client.query(`
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
    method: 'GET',
    path : 'groups/valid/:name',
    cmnd : async (props) => {
      try {
        const { name } = props.event.pathParameters;

        const { rows: [{ count }] } = await props.client.query<{count: number}>(`
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
    
    method: 'POST',
    path : 'groups/users/invite',
    cmnd : async (props) => {
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
    method: 'POST',
    path : 'groups/user/role',
    cmnd : async (props) => {
      try {

        // manipulate group user roles association

        return true;

        // const { name } = props.event.body;

        // const { rows: [{ count }] } = await props.client.query<{count: number}>(`
        //   SELECT COUNT(*) as count
        //   FROM groups
        //   WHERE name = $1
        // `, [name]);

        // return { checkingName: false, isValid: count == 0 };
        
      } catch (error) {
        throw error;
      }

    }
  }

];

export default groups;