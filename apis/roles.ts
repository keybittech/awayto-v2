import { IRole, IRoleActionTypes, IUserProfile, utcNowString } from 'awayto/core';
import { asyncForEach } from 'awayto/core';
import { ApiModule } from '../api';
import { buildUpdate } from '../util/db';
import { redisProxy } from '../util/redis';

const roles: ApiModule = [

  {
    action: IRoleActionTypes.POST_ROLES,
    cmnd : async (props) => {
      try {

        const { name } = props.event.body;
        const { adminSub } = await redisProxy('adminSub');

        const { rows: [ role ] } = await props.db.query<IRole>(`
          WITH input_rows(name, created_sub) as (VALUES ($1, $2::uuid)), ins AS (
            INSERT INTO dbtable_schema.roles (name, created_sub)
            SELECT * FROM input_rows
            ON CONFLICT (name) DO NOTHING
            RETURNING id, name
          )
          SELECT id, name
          FROM ins
          UNION ALL
          SELECT s.id, s.name
          FROM input_rows
          JOIN dbtable_schema.roles s USING (name);
        `, [name, adminSub]);

        const { rows: [{ id: userId }] } = await props.db.query<IUserProfile>(`
          SELECT id FROM dbtable_schema.users WHERE sub = $1
        `, [props.event.userSub]);

        await props.db.query(`
          INSERT INTO dbtable_schema.user_roles (user_id, role_id, created_sub)
          VALUES ($1::uuid, $2::uuid, $3::uuid)
          ON CONFLICT (user_id, role_id) DO NOTHING
        `, [userId, role.id, props.event.userSub]);

        await props.redis.del(props.event.userSub + 'profile/details');

        return [role];

      } catch (error) {
        throw error;
      }
    }
  },

  {
    action: IRoleActionTypes.PUT_ROLES,
    cmnd : async (props) => {
      try {
        const { id, name } = props.event.body;

        const updateProps = buildUpdate({
          id,
          name,
          updated_sub: props.event.userSub,
          updated_on: utcNowString()
        });

        const { rows: [ role ] } = await props.db.query<IRole>(`
          UPDATE dbtable_schema.roles
          SET ${updateProps.string}
          WHERE id = $1
          RETURNING id, name
        `, updateProps.array);

        await props.redis.del(props.event.userSub + 'profile/details');

        return [role];
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IRoleActionTypes.GET_ROLES,
    cmnd : async (props) => {
      try {

        const response = await props.db.query<IRole>(`
          SELECT eur.id, er.name, eur."createdOn" 
          FROM dbview_schema.enabled_roles er
          LEFT JOIN dbview_schema.enabled_user_roles eur ON er.id = eur."roleId"
          LEFT JOIN dbview_schema.enabled_users eu ON eu.id = eur."userId"
          WHERE eu.sub = $1
        `, [props.event.userSub]);
        
        return response.rows;
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IRoleActionTypes.GET_ROLES_BY_ID,
    cmnd : async (props) => {
      try {
        const { id } = props.event.pathParameters;

        const response = await props.db.query<IRole>(`
          SELECT * FROM dbview_schema.enabled_roles
          WHERE id = $1
        `, [id]);
        
        return response.rows[0];
        
      } catch (error) {
        throw error;
      }

    }
  },

  {
    action: IRoleActionTypes.DELETE_ROLES,
    cmnd : async (props) => {
      try {

        const { ids } = props.event.pathParameters;
        
        const { rows: [{ id: userId }] } = await props.db.query<IUserProfile>(`
          SELECT id FROM dbtable_schema.users WHERE sub = $1
        `, [props.event.userSub]);

        await asyncForEach(ids.split(','), async id => {
          await props.db.query(`
            DELETE FROM dbtable_schema.user_roles
            WHERE role_id = $1 AND user_id = $2
          `, [id, userId]);
        });

        await props.redis.del(props.event.userSub + 'profile/details');

        return ids.split(',').map<Partial<IRole>>(id => ({ id }));
        
      } catch (error) {
        throw error;
      }

    }
  },

  // {
  //   action: IRoleActionTypes.DISABLE_ROLES,
  //   cmnd : async (props) => {
  //     try {
  //       const { roles } = props.event.body;

  //       console.log({ roles })

  //       await asyncForEach(Object.values(roles), async role => {
  //         await props.db.query(`
  //           UPDATE dbtable_schema.roles
  //           SET enabled = false, updated_on = $2, updated_sub = $3
  //           WHERE id = $1
  //         `, [role.id, utcNowString(), props.event.userSub]);
  //       });

  //       return roles;
        
  //     } catch (error) {
  //       throw error;
  //     }

  //   }
  // }
];

export default roles;