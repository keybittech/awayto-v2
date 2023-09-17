import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';
import { IService } from './service';

/**
 * @category Group Service
 * @purpose extends a Service to include details about the Group it is attached to
 */
export type IGroupService = IService & {
  groupId: string;
  serviceId: string;
  ids: string[];
};

/**
 * @category Group Service
 */
export default {
  postGroupService: {
    kind: EndpointType.MUTATION,
    url: 'group/services/:serviceId',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { serviceId: '' as string },
    resultType: [] as IGroupService[]
  },
  getGroupServices: {
    kind: EndpointType.QUERY,
    url: 'group/services',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IGroupService[]
  },
  deleteGroupService: {
    kind: EndpointType.MUTATION,
    url: 'group/services/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { ids: '' as string },
    resultType: [] as { id: string }[]
  }
} as const;