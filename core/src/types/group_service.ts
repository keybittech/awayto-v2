import { ApiOptions, EndpointType } from './api';
import { IService } from './service';

/**
 * @category Group Service
 * @purpose extends a Service to include details about the Group it is attached to
 */
export type IGroupService = IService & {
  groupId: string;
  groupName: string;
  serviceId: string;
  ids: string[];
};

/**
 * @category Group Service
 */
export default {
  postGroupService: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/services/:serviceId',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, serviceId: '' as string },
    resultType: [] as IGroupService[]
  },
  getGroupServices: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/services',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string },
    resultType: [] as IGroupService[]
  },
  deleteGroupService: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/services/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, ids: '' as string },
    resultType: [] as { id: string }[]
  }
} as const;