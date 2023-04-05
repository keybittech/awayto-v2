import { Extend, Void } from "../util";
import { ApiHandler, ApiOptions, buildUpdate, EndpointType, siteApiHandlerRef, siteApiRef } from "./api";
import { IServiceAddon } from "./service_addon";
import { utcNowString } from "./time_unit";

/**
 * @category Service Tier
 */
export type IServiceTier = {
  id: string;
  serviceId: string;
  formId: string;
  name: string;
  multiplier: string;
  addons: Record<string, IServiceAddon>;
  order: number;
  createdOn: string;
};

/**
 * @category Action Types
 */
export enum IServiceTierActionTypes {
  POST_SERVICE_TIER = "POST/service_tiers",
  PUT_SERVICE_TIER = "PUT/service_tiers",
  GET_SERVICE_TIERS = "GET/service_tiers",
  GET_SERVICE_TIER_BY_ID = "GET/service_tiers/:id",
  DELETE_SERVICE_TIER = "DELETE/service_tiers/:id",
  DISABLE_SERVICE_TIER = "PUT/service_tiers/:id/disable"
}

/**
 * @category ServiceTier
 */
const serviceTierApi = {
  postServiceTier: {
    kind: EndpointType.MUTATION,
    url: 'service_tiers',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { name: '' as string, serviceId: '' as string, multiplier: '' as string },
    resultType: { id: '' as string }
  },
  putServiceTier: {
    kind: EndpointType.MUTATION,
    url: 'service_tiers',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, name: '' as string, multiplier: '' as string },
    resultType: { id: '' as string }
  },
  getServiceTiers: {
    kind: EndpointType.QUERY,
    url: 'service_tiers',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IServiceTier[]
  },
  getServiceTierById: {
    kind: EndpointType.QUERY,
    url: 'service_tiers/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IServiceTier
  },
  deleteServiceTier: {
    kind: EndpointType.MUTATION,
    url: 'service_tiers/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IServiceTier
  },
  disableServiceTier: {
    kind: EndpointType.MUTATION,
    url: 'service_tiers/:id/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;


/**
 * @category Service Tier
 */
const serviceTierApiHandlers: ApiHandler<typeof serviceTierApi> = {
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

    if (!id) throw new Error('Service ID or Service Tier ID Missing');

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
} as const;

/**
 * @category Service Tier
 */
type ServiceTierApi = typeof serviceTierApi;

/**
 * @category Service Tier
 */
type ServiceTierApiHandler = typeof serviceTierApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<ServiceTierApi> { }
  interface SiteApiHandlerRef extends Extend<ServiceTierApiHandler> { }
}

Object.assign(siteApiRef, serviceTierApi);
Object.assign(siteApiHandlerRef, serviceTierApiHandlers);