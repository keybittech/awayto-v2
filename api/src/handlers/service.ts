import { DbError, IService, IServiceTier, buildUpdate, utcNowString, asyncForEach, createHandlers } from 'awayto/core';

export default createHandlers({
  postService: async props => {
    try {

      const { name, cost, formId, surveyId, tiers } = props.event.body;
      
      const { id } = await props.tx.one<IService>(`
        INSERT INTO dbtable_schema.services (name, cost, form_id, survey_id, created_sub)
        VALUES ($1, $2::integer, $3::uuid, $4::uuid, $5::uuid)
        RETURNING id
      `, [name, cost || 0, formId || undefined, surveyId || undefined, props.event.userSub]);

      await asyncForEach(Object.values(tiers).sort((a, b) => a.order - b.order), async t => {
        const serviceTier = await props.tx.one<IServiceTier>(`
          WITH input_rows(name, service_id, multiplier, form_id, survey_id, created_sub) as (VALUES ($1, $2::uuid, $3::decimal, $4::uuid, $5::uuid, $6::uuid)), ins AS (
            INSERT INTO dbtable_schema.service_tiers (name, service_id, multiplier, form_id, survey_id, created_sub)
            SELECT * FROM input_rows
            ON CONFLICT (name, service_id) DO NOTHING
            RETURNING id
          )
          SELECT id
          FROM ins
          UNION ALL
          SELECT st.id
          FROM input_rows
          JOIN dbtable_schema.service_tiers st USING (name, service_id);
        `, [t.name, id, t.multiplier, t.formId || undefined, t.surveyId || undefined, props.event.userSub]);

        await asyncForEach(Object.values(t.addons).sort((a, b) => a.order - b.order), async a => {
          await props.tx.none(`
            INSERT INTO dbtable_schema.service_tier_addons (service_addon_id, service_tier_id, created_sub)
            VALUES ($1, $2, $3::uuid)
            ON CONFLICT (service_addon_id, service_tier_id) DO NOTHING
          `, [a.id, serviceTier.id, props.event.userSub]);
        })
      });
      
      return { id };

    } catch (error) {
      const { constraint } = error as DbError;

      if ('services_name_created_sub_key' === constraint) {
        throw { reason: 'You already have a service with the same name.' }
      }

      throw error;
    }
  },
  putService: async props => {
    const { id, name } = props.event.body;

    const updateProps = buildUpdate({
      id,
      name,
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });

    // TODO: Allow tier revisions

    await props.tx.none(`
      UPDATE dbtable_schema.services
      SET ${updateProps.string}
      WHERE id = $1
    `, updateProps.array);

    return { id };
  },
  getServices: async props => {
    const services = await props.db.manyOrNone<IService>(`
      SELECT * FROM dbtable_schema.services
      WHERE created_sub = $1
    `, [props.event.userSub]);
    
    return services;
  },
  getServiceById: async props => {
    const { id } = props.event.pathParameters;

    const service = await props.db.one<IService>(`
      SELECT * FROM dbview_schema.enabled_services_ext
      WHERE id = $1
    `, [id]);
    
    return service;
  },
  deleteService: async props => {
    const { ids } = props.event.pathParameters;
    const idSplit = ids.split(',');

    await asyncForEach(idSplit, async id => {
      await props.tx.none(`
        DELETE FROM dbtable_schema.services
        WHERE id = $1
      `, [id]);

      await props.redis.del(props.event.userSub + 'services/' + id);
    });

    await props.redis.del(props.event.userSub + 'services');

    return idSplit.map(id => ({id}));
  },
  disableService: async props => {
    const { ids } = props.event.pathParameters;
    const idSplit = ids.split(',');

    await asyncForEach(idSplit, async id => {
      await props.tx.none(`
        UPDATE dbtable_schema.services
        SET enabled = false, updated_on = $2, updated_sub = $3
        WHERE id = $1
      `, [id, utcNowString(), props.event.userSub]);

      await props.redis.del(props.event.userSub + 'services/' + id);
    });

    await props.redis.del(props.event.userSub + 'services');
    
    return idSplit.map(id => ({id}));
  },
});