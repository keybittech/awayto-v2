import { IUserProfile } from 'awayto';
import { keycloak } from '../util/keycloak';
import { ApiModule } from "../util/db";
import users from './profiles';

const manageUsers: ApiModule = [

  {
    method: 'POST',
    path: 'manage/users/sub',
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
    method: 'POST',
    path: 'manage/users',
    cmnd: async (props) => {
      try {
        const usersApiPostUser = users.findIndex(api => 'post' === api.method.toLowerCase() && 'users' === api.path.toLowerCase());

        const { id } = await users[usersApiPostUser].cmnd(props) as IUserProfile;

        const { rows: [ user ] } = await props.client.query<IUserProfile>(`
          SELECT * FROM dbview_schema.enabled_users_ext
          WHERE id = $1 
        `, [id]);

        // await attachCognitoInfoToUser(user);

        const keycloakUser = await keycloak.users.findOne({ id: user.sub });

        return user;
      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path: 'manage/users',
    cmnd: async (props) => {
      try {
        const { username, groups } = props.event.body as IUserProfile;

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
    method: 'GET',
    path: 'manage/users',
    cmnd: async (props) => {
      try {
        // const { Users } = await listUsers();
        
        // const { rows: dbUsers } = await props.client.query<IUserProfile>('SELECT * FROM dbview_schema.enabled_users_ext');

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

        const keycloakUserList = await keycloak.users.find();

        return keycloakUserList;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path: 'manage/users/page/:page/:perPage',
    cmnd: async (props) => {
      const { page, perPage } = props.event.pathParameters;

      const minId = (parseInt(page) - 1) * parseInt(perPage);
      try {

        const response = await props.client.query(`
          SELECT * FROM dbview_schema.enabled_users_ext
          WHERE row > $1
          LIMIT $2
        `, [minId, perPage]);

        return (response.rows || []) as IUserProfile[];

      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path: 'manage/users/id/:id',
    cmnd: async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query(`
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
    method: 'GET',
    path: 'manage/users/sub/:sub',
    cmnd: async (props) => {
      try {
        const { sub } = props.event.pathParameters;

        const response = await props.client.query(`
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
    method: 'GET',
    path: 'manage/users/info',
    cmnd: async (props) => {
      try {
        const { users } = props.event.body as { users: IUserProfile[] };

        // await asyncForEach(users, async (user: IUserProfile) => {
        //   const info = await getUserInfo(user.username);
        //   user = { ...user, info };
        // });

        return users;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'PUT',
    path: 'manage/users/lock',
    cmnd: async (props) => {
      const profiles = props.event.body as IUserProfile[];
      try {
        // await asyncForEach<IUserProfile>(profiles, async (profile) => {

        //   console.log('profile', profile);
        //   const result = await props.client.query<IUserProfile>(`
        //     UPDATE users
        //     SET locked = true
        //     WHERE username = $1;
        //   `, [profile.username])
        //   await adminDisableUser(profile.username);
        // });

        return profiles;
      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path: 'manage/users/unlock',
    cmnd: async (props) => {
      try {
        const profiles = props.event.body as IUserProfile[];

        // await asyncForEach(profiles, async (profile) => {
        //   await props.client.query<IUserProfile>(`
        //     UPDATE users
        //     SET locked = false
        //     WHERE username = $1;
        //   `, [profile.username])
        //   await adminEnableUser(profile.username);
        // });

        return profiles;
      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path: 'manage/users/attributes',
    cmnd: async (props) => {
      try {
        const { username } = props.event.body as { username: string };
        
        
        return true;
      } catch (error) {
        throw error;
      }
    }
  },
];

export default manageUsers;