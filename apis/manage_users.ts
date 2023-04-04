import { IManageUsersActionTypes, IUserProfileActionTypes, IUserProfile } from 'awayto/core';
import { keycloak } from '../util/keycloak';
import { ApiModule } from '../api';
import profileApi from './profiles';

const manageUsers: ApiModule = [

  {
    action: IManageUsersActionTypes.POST_MANAGE_USERS_SUB,
    cmnd: async (props) => {

      // let user = props.event.body as IUserProfile & { password: string };
      
      // const { username, email, password, groups } = user;
      try {
      //   const keycloakUser = await keycloak.users.create({
      //     username,
      //     email,
      //     credentials: [{
      //       type: 'password',
      //       temporary: true,
      //       value: password
      //     }],
      //     attributes: {
      //       groupRoles: []
      //     }
      //   });

      //   user.sub = keycloakUser.id;

      //   return user as IUserProfile;
        return false;
      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IManageUsersActionTypes.POST_MANAGE_USERS,
    cmnd: async (props) => {
      try {
        // const usersApiPostUser = profileApi.find(api => api.action === IUserProfileActionTypes.POST_USER_PROFILE);

        // const { id } = await usersApiPostUser?.cmnd(props) as IUserProfile;

        // const { rows: [ user ] } = await props.db.query<IUserProfile>(`
        //   SELECT * FROM dbview_schema.enabled_users_ext
        //   WHERE id = $1 
        // `, [id]);

        // // await attachCognitoInfoToUser(user);

        // const keycloakUser = await keycloak.users.findOne({ id: user.sub });

        return false;
      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IManageUsersActionTypes.PUT_MANAGE_USERS,
    cmnd: async (props) => {
      try {
        // const { username, groups } = props.event.body as IUserProfile;

        // if (groupRoles.length) {

        //   const att
        // method: 'custom',ributes = [{
        //     Name: 'admin',
        //     Value: groupRoles
        //   }];

        //   await updateUserAttributesAdmin(username, attributes);
        // }
        
        // await usersApi.update_user.cmnd(props);

        // return props.event.body as IUserProfile;

        return true;
      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IManageUsersActionTypes.GET_MANAGE_USERS,
    cmnd: async (props) => {
      try {
        // const { Users } = await listUsers();
        
        // const { rows: dbUsers } = await props.db.query<IUserProfile>('SELECT * FROM dbview_schema.enabled_users_ext');

        // const users = Users?.map(u => {
        //   return {
        //     ...dbUsers.find(du => du.username == u.Username) || {},
        //     username: u.Username,
        //     status: u.UserStatus,
        //     createdOn: u.UserCreateDate?.toISOString(),
        //     groups: parseGroupString(u.Attributes?.find(a => a.Name == 'custom:admin')?.Value as string),
        //     sub: u.Attributes?.find(a => a.Name == 'sub')?.Value as string,
        //     email: u.Attributes?.find(a => a.Name == 'email')?.Value as string,
        //     locked: !u.Enabled
        //   } as IUserProfile;
        // }) || [];

        // return users;
        return true;
        // const keycloakUserList = await keycloak.users.find();

        // return keycloakUserList;

      } catch (error) {
        throw error;
      }

    }
  },

  // {
  //   method: 'GET',
  //   path: 'manage/users/page/:page/:perPage',
  //   cmnd: async (props) => {
  //     const { page, perPage } = props.event.pathParameters;

  //     const minId = (parseInt(page) - 1) * parseInt(perPage);
  //     try {

  //       const response = await props.db.query(`
  //         SELECT * FROM dbview_schema.enabled_users_ext
  //         WHERE row > $1
  //         LIMIT $2
  //       `, [minId, perPage]);

  //       return (response.rows || []) as IUserProfile[];

  //     } catch (error) {
  //       throw error;
  //     }

  //   }
  // },

  {
    action: IManageUsersActionTypes.GET_MANAGE_USERS_BY_ID,
    cmnd: async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query(`
          SELECT * FROM dbview_schema.enabled_users_ext
          WHERE id = $1 
        `, [id]);

        const user = (response.rows[0] || {}) as IUserProfile;

        // user.username && await attachCognitoInfoToUser(user);

        return user;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IManageUsersActionTypes.GET_MANAGE_USERS_BY_SUB,
    cmnd: async (props) => {
      try {
        const { sub } = props.event.pathParameters;

        const response = await props.db.query(`
          SELECT * FROM dbview_schema.enabled_users_ext
          WHERE sub = $1 
        `, [sub]);

        const user = (response.rows[0] || {}) as IUserProfile;

        // user.username && await attachCognitoInfoToUser(user);

        return user;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IManageUsersActionTypes.GET_MANAGE_USERS_INFO,
    cmnd: async (props) => {
      try {
        // const { users } = props.event.body as { users: IUserProfile[] };

        // await asyncForEach(users, async (user: IUserProfile) => {
        //   const info = await getUserInfo(user.username);
        //   user = { ...user, info };
        // });

        // return users;

        return false;
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IManageUsersActionTypes.LOCK_MANAGE_USERS,
    cmnd: async (props) => {
      // const profiles = props.event.body as IUserProfile[];
      try {
        // await asyncForEach<IUserProfile>(profiles, async (profile) => {

        //   console.log('profile', profile);
        //   const result = await props.db.query<IUserProfile>(`
        //     UPDATE users
        //     SET locked = true
        //     WHERE username = $1;
        //   `, [profile.username])
        //   await adminDisableUser(profile.username);
        // });

        // return profiles;

        return false;
      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IManageUsersActionTypes.UNLOCK_MANAGE_USERS,
    cmnd: async (props) => {
      try {
        // const profiles = props.event.body as IUserProfile[];

        // await asyncForEach(profiles, async (profile) => {
        //   await props.db.query<IUserProfile>(`
        //     UPDATE users
        //     SET locked = false
        //     WHERE username = $1;
        //   `, [profile.username])
        //   await adminEnableUser(profile.username);
        // });

        // return profiles;
        return true;
      } catch (error) {
        throw error;
      }
    }
  }
];

export default manageUsers;