import { IManageRolesActionTypes, IRole } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const manageRoles: ApiModule = [

  {
    action: IManageRolesActionTypes.POST_MANAGE_ROLES,
    cmnd : async (props) => {
      try {

        const { name } = props.event.body as IRole;

        const response = await props.db.query<IRole>(`
          INSERT INTO roles (name)
          VALUES ($1)
          RETURNING id, name
        `, [name]);
        
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
        const { id, name } = props.event.body as IRole;

        const updateProps = buildUpdate({ id, name });

        const response = await props.db.query<IRole>(`
          UPDATE roles
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
          DELETE FROM roles
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