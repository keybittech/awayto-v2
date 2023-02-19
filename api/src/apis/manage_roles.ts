import { IRole } from 'awayto';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';

const manageRoles: ApiModule = [

  {
    method: 'POST',
    path : 'manage/roles',
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
    method: 'PUT',
    path : 'manage/roles',
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
    method: 'GET',
    path : 'manage/roles',
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
    method: 'GET',
    path : 'manage/roles/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IRole>(`
          SELECT * FROM dbview_schema.enabled_roles
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
    path : 'manage/roles/:id',
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
  },

  {
    method: 'PUT',
    path : 'manage/roles/:id/disable',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.db.query(`
          UPDATE roles
          SET enabled = false
          WHERE id = $1
        `, [id]);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  }

];

export default manageRoles;