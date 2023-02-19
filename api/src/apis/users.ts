import { IUser } from 'awayto';
import { asyncForEach } from 'awayto';
import { ApiModule } from '../api';

const users: ApiModule = [

  {
    method: 'POST',
    path : 'users',
    cmnd : async (props) => {
      try {

        // A group owner is trying to post a new user here?
        // Probably doesn't happen
        return true;
      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path : 'users',
    cmnd : async (props) => {
      try {

        // A group owner is trying to put an existing user here?
        // Probably doesn't happen
        return true;
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'users',
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IUser>(`
          SELECT eu.* FROM dbview_schema.enabled_users eu
          LEFT JOIN dbview_schema.enabled_uuid_groups eug ON eug."parentUuid" = eu.id
          LEFT JOIN dbview_schema.enabled_groups eg ON eg.id = eug."groupId"
          WHERE eg."createdSub" = $1
        `, [props.event.userSub]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path : 'users/:id',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IUser>(`
          SELECT * FROM dbview_schema.enabled_users
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
    path : 'users/:ids',
    cmnd : async (props) => {
      try {

        // A group owner is trying to post a new user here?
        // Probably doesn't happen
        return true;        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'PUT',
    path : 'users/disable',
    cmnd : async (props) => {
      try {
        const users = props.event.body as IUser[];

        await asyncForEach(users, async role => {
          await props.db.query(`
            UPDATE users
            SET enabled = false
            WHERE id = $1
          `, [role.id]);
        });

        return users;
        
      } catch (error) {
        throw error;
      }

    }
  }

];

export default users;