import { ApiOptions, EndpointType } from './api';
import { IServiceAddon } from './service_addon';

/**
 * @category Group Service Addon
 * @purpose extends a Service Addon to include the properties of the Group it belongs to
 */
export type IGroupServiceAddon = IServiceAddon & {
  groupId: string;
};

/**
 * @category Group Service Addon
 */
export default {
  postGroupServiceAddon: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/service_addons/:serviceAddonId',
    method: 'POST',
    opts: {
      throttle: 1
    } as ApiOptions,
    queryArg: {
      groupName: '' as string,
      serviceAddonId: '' as string
    },
    resultType: [] as IGroupServiceAddon[]
  },
  getGroupServiceAddons: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/service_addons',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {
      groupName: '' as string
    },
    resultType: [] as IGroupServiceAddon[]
  },
  deleteGroupServiceAddon: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/service_addons/:serviceAddonId',
    method: 'DELETE',
    opts: {
      throttle: 1
    } as ApiOptions,
    queryArg: {
      groupName: '' as string,
      serviceAddonId: '' as string
    },
    resultType: [{ id: '' as string }]
  }
} as const;