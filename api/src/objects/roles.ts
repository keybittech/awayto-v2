import { IRole, IUserProfile } from 'awayto';
import { ApiModule, asyncForEach, buildUpdate } from '../util/db';

import { keycloak } from '../util/keycloak';

const roles: ApiModule = [

  {
    method: 'POST',
    path : 'roles',
    cmnd : async (props) => {
      try {

        const { name } = props.event.body as IRole;

        const { rows: [ role ] } = await props.client.query<IRole>(`
          WITH input_rows(name, created_sub) as (VALUES ($1, $2)), ins AS (
            INSERT INTO roles (name, created_sub)
            SELECT * FROM input_rows
            ON CONFLICT (name) DO NOTHING
            RETURNING id, name
          )
          SELECT id, name
          FROM ins
          UNION ALL
          SELECT s.id, s.name
          FROM input_rows
          JOIN roles s USING (name);
        `, [name, props.event.userSub]);

        const { rows: [{ id: userId }] } = await props.client.query<IUserProfile>(`
          SELECT id FROM users WHERE sub = $1
        `, [props.event.userSub]);

        await props.client.query(`
          INSERT INTO uuid_roles (parent_uuid, role_id, created_sub)
          VALUES ($1, $2, $3)
          ON CONFLICT (parent_uuid, role_id) DO NOTHING
        `, [userId, role.id, props.event.userSub])

        return [role];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path : 'roles',
    cmnd : async (props) => {
      try {
        const { id, name } = props.event.body as IRole;

        const updateProps = buildUpdate({ id, name });

        const { rows: [ role ] } = await props.client.query<IRole>(`
          UPDATE roles
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, name
        `, updateProps.array);

        return role;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'roles',
    cmnd : async (props) => {
      try {

        const response = await props.client.query<IRole>(`
          SELECT eur.id, er.name 
          FROM enabled_roles er
          LEFT JOIN enabled_uuid_roles eur ON er.id = eur."roleId"
          LEFT JOIN users u ON u.id = eur."parentUuid"
          WHERE u.sub = $1
        `, [props.event.userSub]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'roles/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<IRole>(`
          SELECT * FROM enabled_roles
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
    path : 'roles/:ids',
    cmnd : async (props) => {
      try {

        console.log({ props })

        const { ids } = props.event.pathParameters;
        
        const { rows: [{ id: userId }] } = await props.client.query<IUserProfile>(`
          SELECT id FROM users WHERE sub = $1
        `, [props.event.userSub]);

        await asyncForEach(ids.split(','), async id => {
          await props.client.query(`
            DELETE FROM uuid_roles
            WHERE role_id = $1 AND parent_uuid = $2
          `, [id, userId]);
        })

        return ids.split(',').map<Partial<IRole>>(id => ({ id }));
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'PUT',
    path : 'roles/disable',
    cmnd : async (props) => {
      try {
        const roles = props.event.body as IRole[];

        await asyncForEach(roles, async role => {
          await props.client.query(`
            UPDATE roles
            SET enabled = false
            WHERE id = $1
          `, [role.id]);
        });

        return roles;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'role/valid/:name',
    cmnd : async (props) => {
      try {
        const { name } = props.event.pathParameters;

        const { rows: [{ count }] } = await props.client.query<{count: number}>(`
          SELECT COUNT(*) as count
          FROM roles
          WHERE name = $1
        `, [name]);

        return { checkingName: false, isValid: count == 0 };
        
      } catch (error) {
        throw error;
      }

    }
  }

];

export default roles;