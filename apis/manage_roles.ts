import { IManageRolesActionTypes, IRole, utcNowString } from 'awayto/core';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const manageRoles: ApiModule = [

  {
    action: IManageRolesActionTypes.POST_MANAGE_ROLES,
    cmnd : async (props) => {
      try {

        const { name } = props.event.body;

        const response = await props.db.query<IRole>(`
          INSERT INTO dbtable_schema.roles (name, created_sub)
          VALUES ($1, $2::uuid)
          RETURNING id, name
        `, [name, props.event.userSub]);
        
        return response.rows[0];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IManageRolesActionTypes.PUT_MANAGE_ROLES,
    cmnd : async (props) => {
      try {
        const { id, name } = props.event.body;

        const updateProps = buildUpdate({
          id,
          name,
          updated_sub: props.event.userSub,
          updated_on: utcNowString()
        });

        const response = await props.db.query<IRole>(`
          UPDATE dbtable_schema.roles
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, name
        `, updateProps.array);

        return response.rows[0];
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IManageRolesActionTypes.GET_MANAGE_ROLES,
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IRole>(`
          SELECT * FROM dbview_schema.enabled_roles
        `);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IManageRolesActionTypes.DELETE_MANAGE_ROLES,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IRole>(`
          DELETE FROM dbtable_schema.roles
          WHERE id = $1
        `, [id]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  }

];

export default manageRoles;