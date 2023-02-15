import { IUserProfile } from 'awayto';
import { ApiModule, buildUpdate } from '../util/db';
import { appClient, keycloak, roleCall } from '../util/keycloak';

const profile: ApiModule = [

  {
    method: 'POST',
    path: 'profile',
    cmnd: async (props) => {
      try {

        const { firstName, lastName, username, email, image, sub } = props.event.body as IUserProfile;
            
        const { rows: [ user ] } = await props.client.query<IUserProfile>(`
          INSERT INTO users(sub, username, first_name, last_name, email, image, created_on, created_sub, ip_address)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING id, sub, username, first_name as "firstName", last_name as "lastName", email, image
        `, [sub || props.event.userSub, username, firstName, lastName, email, image, new Date(), props.event.userSub, props.event.sourceIp]);

        return user;

      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'PUT',
    path: 'profile',
    cmnd: async (props) => {
      try {
        const { id, firstName: first_name, lastName: last_name, email, image } = props.event.body as IUserProfile;

        if (!id || !props.event.userSub) return false;

        const updateProps = buildUpdate({ id, first_name, last_name, email, image, updated_on: (new Date()).toISOString(), updated_sub: props.event.userSub });

        const { rows: [ user ] } = await props.client.query<IUserProfile>(`
          UPDATE users
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, first_name as "firstName", last_name as "lastName", email, image
        `, updateProps.array);

        try {
          await keycloak.users.update({
            id: props.event.userSub
          }, {
            firstName: first_name,
            lastName: last_name
          })
        } catch (error) { }

        return user;

      } catch (error) {
        throw error;
      }
    }
  },

  {
    method: 'GET',
    path: 'profile/details',
    cmnd: async (props) => {
      try {
        const [user] = (await props.client.query<IUserProfile>(`
          SELECT * 
          FROM dbview_schema.enabled_users_ext
          WHERE sub = $1
        `, [props.event.userSub])).rows;

        user.availableUserGroupRoles = props.event.availableUserGroupRoles;

        try {
          await keycloak.users.delClientRoleMappings({
            clientUniqueId: appClient.id!,
            id: user.sub,
            roles: roleCall
          });
        } catch (error) {}

        return user;

      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path: 'profile/details/sub/:sub',
    cmnd: async (props) => {
      const { sub } = props.event.pathParameters;

      try {
        const response = await props.client.query<IUserProfile>(`
          SELECT * FROM dbview_schema.enabled_users
          WHERE sub = $1 
        `, [sub]);

        return response.rows[0] || {};

      } catch (error) {
        throw error;
      }

    }
  },

  {
    method: 'GET',
    path: 'profile/details/id/:id',
    cmnd: async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.client.query<IUserProfile>(`
          SELECT * FROM dbview_schema.enabled_users
          WHERE id = $1 
        `, [id]);

        return response.rows[0] || {};

      } catch (error) {
        throw error;
      }

    }
  },

  // {
  //   method: 'POST',
  //   path: 'users/push_token',
  //   cmnd: async (props) => {
  //     try {

  //       const response = await props.client.query(`
  //         UPDATE users
  //         SET push_token = $2
  //         WHERE sub = $1
  //       `, [props.event.userSub, props.event.body.token]);

  //       return response.rows;

  //     } catch (error) {
  //       throw error;
  //     }

  //   }
  // },

  {
    method: 'PUT',
    path : 'profile/:id/disable',
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.client.query(`
          UPDATE users
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

export default profile;