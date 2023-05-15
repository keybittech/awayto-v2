import { IServiceAddon, buildUpdate, createHandlers, utcNowString } from 'awayto/core';

export default createHandlers({
  postServiceAddon: async props => {
    const { name } = props.event.body;

    const serviceAddon = await props.tx.one<IServiceAddon>(`
      WITH input_rows(name, created_sub) as (VALUES ($1, $2::uuid)), ins AS (
        INSERT INTO dbtable_schema.service_addons (name, created_sub)
        SELECT * FROM input_rows
        ON CONFLICT (name) DO NOTHING
        RETURNING id, name
      )
      SELECT id, name
      FROM ins
      UNION ALL
      SELECT sa.id, sa.name
      FROM input_rows
      JOIN dbtable_schema.service_addons sa USING (name);
    `, [name, props.event.userSub]);
    
    return serviceAddon;
  },
  putServiceAddon: async props => {
    const { id, name } = props.event.body;

    const updateProps = buildUpdate({
      id,
      name,
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });

    const serviceAddon = await props.tx.one<IServiceAddon>(`
      UPDATE dbtable_schema.service_addons
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id, name
    `, updateProps.array);

    return serviceAddon;
  },
  getServiceAddons: async props => {
    const serviceAddons = await props.db.manyOrNone<IServiceAddon>(`
      SELECT * FROM dbview_schema.enabled_service_addons
    `);

    return serviceAddons;
  },
  getServiceAddonById: async props => {
    const { id } = props.event.pathParameters;

    const serviceAddon = await props.db.one<IServiceAddon>(`
      SELECT * FROM dbview_schema.enabled_service_addons
      WHERE id = $1
    `, [id]);

    return serviceAddon;
  },
  deleteServiceAddon: async props => {
    const { id } = props.event.pathParameters;

    const serviceAddon = await props.tx.one<IServiceAddon>(`
      DELETE FROM dbtable_schema.service_addons
      WHERE id = $1
      RETURNING id
    `, [id]);

    return serviceAddon;
  },
  disableServiceAddon: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      UPDATE dbtable_schema.service_addons
      SET enabled = false, updated_on = $2, updated_sub = $3
      WHERE id = $1
    `, [id, utcNowString(), props.event.userSub]);

    return { id };
  }
});