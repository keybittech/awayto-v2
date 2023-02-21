import { IUser, IUserActionTypes } from 'awayto';
import { asyncForEach } from 'awayto';
import { ApiModule } from '../api';

const users: ApiModule = [

  {
    action: IUserActionTypes.POST_USERS,
    cmnd : async (props) => {
      try {

        // A group owner is trying to post a new user here?
        // Probably doesn't happen
        return false;
      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IUserActionTypes.PUT_USERS,
    cmnd : async (props) => {
      try {

        // A group owner is trying to put an existing user here?
        // Probably doesn't happen
        return false;
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IUserActionTypes.GET_USERS,
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
    action: IUserActionTypes.GET_USERS_BY_ID,
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
    action: IUserActionTypes.DELETE_USERS,
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
    action: IUserActionTypes.DISABLE_USERS,
    cmnd : async (props) => {
      try {
        const { users } = props.event.body;

        await asyncForEach(Object.values(users), async role => {
          await props.db.query(`
            UPDATE dbtable_schema.users
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