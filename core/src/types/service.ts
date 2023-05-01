import { asyncForEach, Extend, Void } from '../util';
import { ApiHandler, ApiOptions, buildUpdate, DbError, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { IServiceTier } from './service_tier';
import { utcNowString } from './time_unit';

/**
 * @category Service
 * @purpose stores parent information about the functions a Group performs which can be requested by Users
 */
export type IService = {
  id: string;
  name: string;
  cost: string;
  tiers: Record<string, IServiceTier>;
  formId: string;
  createdOn: string;
};

/**
 * @category Service
 */
const serviceApi = {
  postService: {
    kind: EndpointType.MUTATION,
    url: 'services',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { name: '' as string, cost: '' as string, formId: '' as string, tiers: {} as Record<string, IServiceTier> },
    resultType: {} as IService
  },
  putService: {
    kind: EndpointType.MUTATION,
    url: 'services',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, name: '' as string },
    resultType: {} as IService
  },
  getServices: {
    kind: EndpointType.QUERY,
    url: 'services',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IService[]
  },
  getServiceById: {
    kind: EndpointType.QUERY,
    url: 'services/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IService
  },
  deleteService: {
    kind: EndpointType.MUTATION,
    url: 'services/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { ids: '' as string },
    resultType: [] as { id: string }[]
  },
  disableService: {
    kind: EndpointType.MUTATION,
    url: 'services/:ids/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { ids: '' as string },
    resultType: [] as { id: string }[]
  }
} as const;

/**
 * @category Manage Service
 */
const serviceApiHandlers: ApiHandler<typeof serviceApi> = {
  postService: async props => {
    try {

      const { name, cost, formId, tiers } = props.event.body;
      
      const service = await props.tx.one<IService>(`
        INSERT INTO dbtable_schema.services (name, cost, form_id, created_sub)
        VALUES ($1, $2::integer, $3::uuid, $4::uuid)
        RETURNING id, name, cost, created_on
      `, [name, cost || 0, formId || undefined, props.event.userSub]);

      await asyncForEach(Object.values(tiers).sort((a, b) => a.order - b.order), async t => {
        const serviceTier = await props.tx.one<IServiceTier>(`
          WITH input_rows(name, service_id, multiplier, form_id, created_sub) as (VALUES ($1, $2::uuid, $3::decimal, $4::uuid, $5::uuid)), ins AS (
            INSERT INTO dbtable_schema.service_tiers (name, service_id, multiplier, form_id, created_sub)
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
        `, [t.name, service.id, t.multiplier, t.formId || undefined, props.event.userSub]);

        await asyncForEach(Object.values(t.addons).sort((a, b) => a.order - b.order), async a => {
          await props.tx.none(`
            INSERT INTO dbtable_schema.service_tier_addons (service_addon_id, service_tier_id, created_sub)
            VALUES ($1, $2, $3::uuid)
            ON CONFLICT (service_addon_id, service_tier_id) DO NOTHING
          `, [a.id, serviceTier.id, props.event.userSub]);
        })
      });
      
      return service;

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

    const service = await props.tx.one<IService>(`
      UPDATE dbtable_schema.services
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id, name
    `, updateProps.array);

    return service;
  },
  getServices: async props => {
    const services = await props.db.manyOrNone<IService>(`
      SELECT * FROM dbview_schema.enabled_services
    `);
    
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
} as const;

/**
 * @category Service
 */
type ServiceApi = typeof serviceApi;

/**
 * @category Service
 */
type ServiceApiHandler = typeof serviceApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<ServiceApi> { }
  interface SiteApiHandlerRef extends Extend<ServiceApiHandler> { }
}

Object.assign(siteApiRef, serviceApi);
Object.assign(siteApiHandlerRef, serviceApiHandlers);