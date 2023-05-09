import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';

/**
 * @category Service Addon
 */
export type IServiceAddon = {
  id: string;
  name: string;
  order: number;
  createdOn: string;
};

/**
 * @category Service Addon
 */
export default {
  postServiceAddon: {
    kind: EndpointType.MUTATION,
    url: 'service_addons',
    method: 'POST',
    opts: {
      throttle: 1
    } as ApiOptions,
    queryArg: { name: '' as string },
    resultType: {} as IServiceAddon
  },
  putServiceAddon: {
    kind: EndpointType.MUTATION,
    url: 'service_addons',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, name: '' as string },
    resultType: {} as IServiceAddon
  },
  getServiceAddons: {
    kind: EndpointType.QUERY,
    url: 'service_addons',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IServiceAddon[]
  },
  getServiceAddonById: {
    kind: EndpointType.QUERY,
    url: 'service_addons/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IServiceAddon
  },
  deleteServiceAddon: {
    kind: EndpointType.MUTATION,
    url: 'service_addons/:id',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IServiceAddon
  },
  disableServiceAddon: {
    kind: EndpointType.MUTATION,
    url: 'service_addons/:id/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;