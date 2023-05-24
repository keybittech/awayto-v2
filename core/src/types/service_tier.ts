import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';
import { IServiceAddon } from './service_addon';

/**
 * @category Service Tier
 * @purpose contains custom Service Addons and multipliers that can be used to adjust the cost of Services
 */
export type IServiceTier = {
  id: string;
  serviceId: string;
  formId: string;
  surveyId: string;
  name: string;
  multiplier: string;
  addons: Record<string, IServiceAddon>;
  order: number;
  createdOn: string;
};

/**
 * @category ServiceTier
 */
export default {
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