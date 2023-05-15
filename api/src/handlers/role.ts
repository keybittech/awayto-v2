import { IRole, IUserProfile, buildUpdate, utcNowString, asyncForEach, createHandlers } from 'awayto/core';

export default createHandlers({
  postRole: async props => {
    const { name } = props.event.body;
    const { adminSub } = await props.redisProxy('adminSub');

    const role = await props.tx.one<IRole>(`
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

    const { id: userId } = await props.tx.one<IUserProfile>(`
      SELECT id FROM dbtable_schema.users WHERE sub = $1
    `, [props.event.userSub]);

    await props.tx.none(`
      INSERT INTO dbtable_schema.user_roles (user_id, role_id, created_sub)
      VALUES ($1::uuid, $2::uuid, $3::uuid)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `, [userId, role.id, props.event.userSub]);

    await props.redis.del(props.event.userSub + 'profile/details');

    return role;
  },
  putRole: async props => {
    const { id, name } = props.event.body;

    const updateProps = buildUpdate({
      id,
      name,
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });

    const role = await props.tx.one<IRole>(`
      UPDATE dbtable_schema.roles
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id, name
    `, updateProps.array);

    await props.redis.del(props.event.userSub + 'profile/details');

    return role;
  },
  getRoles: async props => {
    const roles = await props.db.manyOrNone<IRole>(`
      SELECT eur.id, er.name, eur."createdOn" 
      FROM dbview_schema.enabled_roles er
      LEFT JOIN dbview_schema.enabled_user_roles eur ON er.id = eur."roleId"
      LEFT JOIN dbview_schema.enabled_users eu ON eu.id = eur."userId"
      WHERE eu.sub = $1
    `, [props.event.userSub]);

    return roles;
  },
  getRoleById: async props => {
    const { id } = props.event.pathParameters;

    const role = await props.db.one<IRole>(`
      SELECT * FROM dbview_schema.enabled_roles
      WHERE id = $1
    `, [id]);

    return role;
  },
  deleteRole: async props => {
    const { ids } = props.event.pathParameters;

    const { id: userId } = await props.tx.one<IUserProfile>(`
      SELECT id FROM dbtable_schema.users WHERE sub = $1
    `, [props.event.userSub]);

    const idsSplit = ids.split(',');

    await asyncForEach(idsSplit, async id => {
      await props.tx.none(`
        DELETE FROM dbtable_schema.user_roles
        WHERE role_id = $1 AND user_id = $2
      `, [id, userId]);
    });

    await props.redis.del(props.event.userSub + 'profile/details');

    return idsSplit.map(id => ({ id }));
  }
});