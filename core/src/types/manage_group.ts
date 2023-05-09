import { Void } from '../util';
import { ApiOptions, EndpointType } from './api';
import { IGroup } from './group';

/**
 * @category Manage Groups
 */
export type IManageGroups = Record<string, IGroup>;

/**
 * @category Manage Groups
 */
export default {
  postManageGroups: {
    kind: EndpointType.MUTATION,
    url: 'manage/groups',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { name: '' as string, roles: {} as Record<string, boolean> },
    resultType: { id: '' as string, name: '' as string, roles: {} as Record<string, boolean> }
  },
  putManageGroups: {
    kind: EndpointType.MUTATION,
    url: 'manage/groups',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, name: '' as string, roles: {} as Record<string, boolean> },
    resultType: { id: '' as string, name: '' as string, roles: {} as Record<string, boolean> }
  },
  getManageGroups: {
    kind: EndpointType.QUERY,
    url: 'manage/groups',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: [] as IGroup[]
  },
  deleteManageGroups: {
    kind: EndpointType.MUTATION,
    url: 'manage/groups',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { ids: [''] as string[] },
    resultType: [] as { id: string }[]
  }
} as const;