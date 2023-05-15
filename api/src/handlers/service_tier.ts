import { IServiceTier, buildUpdate, createHandlers, utcNowString } from 'awayto/core';

export default createHandlers({
  postServiceTier: async props => {
    const { name, serviceId, multiplier } = props.event.body;

    const serviceTier = await props.tx.one<IServiceTier>(`
      INSERT INTO dbtable_schema.service_tiers (name, serviceId, multiplier, created_sub)
      VALUES ($1, $2, $3, $4::uuid)
      RETURNING id
    `, [name, serviceId, multiplier, props.event.userSub]);

    return serviceTier;
  },
  putServiceTier: async props => {
    const { id, name, multiplier } = props.event.body;

    const updateProps = buildUpdate({
      id,
      name,
      multiplier,
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });

    const serviceTier = await props.tx.one<IServiceTier>(`
      UPDATE dbtable_schema.service_tiers
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id
    `, updateProps.array);

    return serviceTier;
  },
  getServiceTiers: async props => {
    const serviceTiers = await props.db.manyOrNone<IServiceTier>(`
      SELECT * FROM dbview_schema.enabled_service_tiers
    `);

    return serviceTiers;
  },
  getServiceTierById: async props => {
    const { id } = props.event.pathParameters;

    const serviceTier = await props.db.one<IServiceTier>(`
      SELECT * FROM dbview_schema.enabled_service_tiers_ext
      WHERE id = $1
    `, [id]);

    return serviceTier;
  },
  deleteServiceTier: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      DELETE FROM dbtable_schema.service_tiers
      WHERE id = $1
    `, [id]);

    return { id };
  },
  disableServiceTier: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      UPDATE dbtable_schema.service_tiers
      SET enabled = false, updated_on = $2, updated_sub = $3
      WHERE id = $1
    `, [id, utcNowString(), props.event.userSub]);

    return { id };
  },
});