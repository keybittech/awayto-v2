import type { IRole } from 'awayto';
import { ApiModule, asyncForEach, buildUpdate } from '../util/db';

const roles: ApiModule = [

  {
    method: 'POST',
    path : 'roles',
    cmnd : async (props) => {
      try {

        const { name } = props.event.body as IRole;

        const { rows: [ role ] } = await props.client.query<IRole>(`
          INSERT INTO roles (name, created_on, created_sub)
          VALUES ($1, $2, $3)
          ON CONFLICT (name) DO NOTHING
          RETURNING id, name, created_sub
        `, [name, new Date(), props.event.userSub]);
        
        return role;

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
          SELECT * FROM enabled_roles
        `);
        
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
    path : 'roles',
    cmnd : async (props) => {
      try {

        const query = props.event.queryParameters;
        const ids = query.ids.split(',');

        await asyncForEach(ids, async id => {
          await props.client.query(`
            DELETE FROM roles
            WHERE id = $1
          `, [id]);
        })

        return ids.map<Partial<IRole>>(id => ({ id }));
        
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