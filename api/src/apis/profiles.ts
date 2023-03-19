import { IUserProfile, IUserProfileActionTypes, utcNowString } from 'awayto';
import { redisProxy } from '../util/redis';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';
import { keycloak } from '../util/keycloak';

const profile: ApiModule = [

  {
    action: IUserProfileActionTypes.POST_USER_PROFILE,
    cmnd: async (props) => {
      try {

        const { firstName, lastName, username, email, image, sub } = props.event.body;
            
        const { rows: [ user ] } = await props.db.query<IUserProfile>(`
          INSERT INTO dbtable_schema.users (sub, username, first_name, last_name, email, image, created_on, created_sub, ip_address)
          VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8::uuid, $9)
          RETURNING id, sub, username, first_name as "firstName", last_name as "lastName", email, image
        `, [sub || props.event.userSub, username, firstName, lastName, email, image, utcNowString(), props.event.userSub, props.event.sourceIp]);

        return user;

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IUserProfileActionTypes.PUT_USER_PROFILE,
    cmnd: async (props) => {
      try {
        const { id, firstName: first_name, lastName: last_name, email, image } = props.event.body;

        if (!id || !props.event.userSub) return false;

        const updateProps = buildUpdate({
          id,
          first_name,
          last_name,
          email,
          image,
          updated_on: utcNowString(),
          updated_sub: props.event.userSub
        });

        const { rows: [ user ] } = await props.db.query<IUserProfile>(`
          UPDATE dbtable_schema.users
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

        await props.redis.del(props.event.userSub + 'profile/details');

        return user;

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IUserProfileActionTypes.GET_USER_PROFILE_DETAILS,
    cmnd: async (props) => {
      try {
        const { roleCall, appClient } = await redisProxy('roleCall', 'appClient');

        const [user] = (await props.db.query<IUserProfile>(`
          SELECT * 
          FROM dbview_schema.enabled_users_ext
          WHERE sub = $1
        `, [props.event.userSub])).rows;

        user.availableUserGroupRoles = props.event.availableUserGroupRoles;

        try {
          await keycloak.users.delClientRoleMappings({
            id: user.sub,
            clientUniqueId: appClient.id!,
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
    action: IUserProfileActionTypes.GET_USER_PROFILE_DETAILS_BY_SUB,
    cmnd: async (props) => {
      const { sub } = props.event.pathParameters;

      try {
        const response = await props.db.query<IUserProfile>(`
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
    action: IUserProfileActionTypes.GET_USER_PROFILE_DETAILS_BY_ID,
    cmnd: async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IUserProfile>(`
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

  //       const response = await props.db.query(`
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
    action: IUserProfileActionTypes.DISABLE_USER_PROFILE,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        await props.db.query(`
          UPDATE dbtable_schema.users
          SET enabled = false, updated_on = $2, updated_sub = $3
          WHERE id = $1
        `, [id, utcNowString(), props.event.userSub]);

        return { id };
        
      } catch (error) {
        throw error;
      }

    }
  }

];

export default profile;