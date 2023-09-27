import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';
import { IServiceTier } from './service_tier';

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
  surveyId: string;
  createdOn: string;
};

/**
 * @category Service
 */
export default {
  postService: {
    kind: EndpointType.MUTATION,
    url: 'service',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { name: '' as string, cost: '' as string, formId: '' as string, surveyId: '' as string, tiers: {} as Record<string, IServiceTier> },
    resultType: { id: '' as string }
  },
  putService: {
    kind: EndpointType.MUTATION,
    url: 'service',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { name: '' as string, cost: '' as string, formId: '' as string, surveyId: '' as string, tiers: {} as Record<string, IServiceTier> },
    resultType: { id: '' as string }
  },
  getServices: {
    kind: EndpointType.QUERY,
    url: 'service',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IService[]
  },
  getServiceById: {
    kind: EndpointType.QUERY,
    url: 'service/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IService
  },
  deleteService: {
    kind: EndpointType.MUTATION,
    url: 'service/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { ids: '' as string },
    resultType: [] as { id: string }[]
  },
  disableService: {
    kind: EndpointType.MUTATION,
    url: 'service/:ids/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { ids: '' as string },
    resultType: [] as { id: string }[]
  }
} as const;