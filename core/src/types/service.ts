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
    url: 'services',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { name: '' as string, cost: '' as string, formId: '' as string, surveyId: '' as string, tiers: {} as Record<string, IServiceTier> },
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