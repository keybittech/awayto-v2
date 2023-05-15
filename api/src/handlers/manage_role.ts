import { IRole, buildUpdate, createHandlers, utcNowString } from 'awayto/core';

export default createHandlers({
  postManageRoles: async props => {
    const { name } = props.event.body;

    const role = await props.tx.one<IRole>(`
      INSERT INTO dbtable_schema.roles (name, created_sub)
      VALUES ($1, $2::uuid)
      RETURNING id, name
    `, [name, props.event.userSub]);

    return role;
  },
  putManageRoles: async props => {
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

    return role;
  },
  getManageRoles: async props => {
    const roles = await props.db.manyOrNone<IRole>(`
      SELECT * FROM dbview_schema.enabled_roles
    `);

    return roles;
  },
  deleteManageRoles: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      DELETE FROM dbtable_schema.roles
      WHERE id = $1
    `, [id]);

    return { id };
  }
});