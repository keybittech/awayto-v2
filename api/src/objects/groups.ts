import type { IGroup, IUuidRoles, DbError, IUuidGroups } from 'awayto';
import { ApiModule, asyncForEach, buildUpdate } from '../util/db';

const groups: ApiModule = [

  {
    method: 'POST',
    path : 'groups',
    cmnd : async (props) => {
      try {

        const { name, roles } = props.event.body as IGroup;

        const { rows: [ group ] } = await props.client.query<IGroup>(`
          INSERT INTO groups (name, created_on, created_sub)
          VALUES ($1, $2, $3)
          ON CONFLICT (name) DO NOTHING
          RETURNING id, name, created_sub
        `, [name, new Date(), props.event.userSub]);

        await asyncForEach(roles, async role => {
          await props.client.query(`
            INSERT INTO uuid_roles (parent_uuid, role_id, created_on, created_sub)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (parent_uuid, role_id) DO NOTHING
          `, [group.id, role.id, new Date(), props.event.userSub])
        });

        // TO DO ONCE WEBHOOK PRE-CREATES USER
        // const response = await props.client.query<IUuidGroups>(`
        //   INSERT INTO uuid_groups (parent_uuid, group_id, created_on, created_sub)
        //   VALUES ($1, $2, $3, $4)
        //   ON CONFLICT (parent_uuid, group_id) DO NOTHING
        //   RETURNING id
        // `, [parentUuid, groupId, new Date(), props.event.userSub]);

        group.roles = roles;
        
        return group;

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
    path : 'groups',
    cmnd : async (props) => {
      try {

        const query = props.event.queryParameters;
        const ids = query.ids.split(',');

        await asyncForEach(ids, async id => {
          await props.client.query(`
            DELETE FROM groups
            WHERE id = $1
          `, [id]);
        })

        return ids.map<Partial<IGroup>>(id => ({ id }));
        
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
    path : 'group/valid/:name',
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
  }

];

export default groups;