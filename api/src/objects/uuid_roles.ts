import { IUuidRoles } from 'awayto';
import { ApiModule, asyncForEach, buildUpdate } from '../util/db';

const uuidRoles: ApiModule = [

  {
    method: 'POST',
    path : 'uuid_roles',
    cmnd : async (props) => {
      try {
        const { parentUuid: parent_uuid, roleIds } = props.event.body as IUuidRoles & { roleIds: string[] };
        
        await props.client.query(`
          DELETE FROM uuid_roles WHERE parent_uuid = $1
        `, [parent_uuid])

        await asyncForEach(roleIds, async (id: string) => {
          await props.client.query(`
            INSERT INTO uuid_roles (parent_uuid, role_id, created_on, created_sub)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (parent_uuid, role_id) DO NOTHING
            RETURNING id, parent_uuid as "parentUuid", role_id as "roleId"
          `, [parent_uuid, id, new Date(), props.event.userSub])
        });
        
        return true;

      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path : 'uuid_roles',
    cmnd : async (props) => {
      try {
        const { id, parentUuid: parent_uuid, roleId: role_id } = props.event.body as IUuidRoles;

        if (!id || !props.event.userSub) return false;

        const updateProps = buildUpdate({ id, parent_uuid, role_id, updated_on: (new Date()).toString(), updated_sub: props.event.userSub });

        await props.client.query(`
          UPDATE uuid_roles
          SET ${updateProps.string}
          WHERE id = $1
        `, updateProps.array);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'uuid_roles',
    cmnd : async (props) => {
      try {

        const response = await props.client.query<IUuidRoles>(`
          SELECT * FROM enabled_uuid_roles
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'uuid_roles/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<IUuidRoles>(`
          SELECT * FROM enabled_uuid_roles
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'DELETE',
    path : 'uuid_roles/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<IUuidRoles>(`
          DELETE FROM uuid_roles
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'PUT',
    path : 'uuid_roles/disable',
    cmnd : async (props) => {
      try {
        const { id, parentUuid: parent_uuid, roleId: role_id } = props.event.body as IUuidRoles;

        await props.client.query(`
          UPDATE uuid_roles
          SET enabled = false
          WHERE parent_uuid = $1 AND role_id = $2
        `, [parent_uuid, role_id]);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  }

];

export default uuidRoles;