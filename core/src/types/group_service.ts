

import { asyncForEach, Extend, Void } from '../util';
import { ApiHandler, ApiOptions, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { IGroup } from './group';
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
const groupServicesApi = {
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

/**
 * @category Group Service
 */
const groupServicesApiHandlers: ApiHandler<typeof groupServicesApi> = {
  postGroupService: async props => {
    const { groupName, serviceId } = props.event.pathParameters;

    const { id: groupId } = await props.tx.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    await props.tx.none(`
      INSERT INTO dbtable_schema.group_services (group_id, service_id, created_sub)
      VALUES ($1, $2, $3::uuid)
      ON CONFLICT (group_id, service_id) DO NOTHING
    `, [groupId, serviceId, props.event.userSub]);

    await props.redis.del(props.event.userSub + `group/${groupName}/services`);

    return [];
  },
  getGroupServices: async props => {
    const { groupName } = props.event.pathParameters;

    const { id: groupId } = await props.db.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    const groupServices = await props.db.manyOrNone<IGroupService>(`
      SELECT es.*, egs."groupId"
      FROM dbview_schema.enabled_group_services egs
      LEFT JOIN dbview_schema.enabled_services es ON es.id = egs."serviceId"
      WHERE egs."groupId" = $1
    `, [groupId]);

    return groupServices;
  },
  deleteGroupService: async props => {
    const { groupName, ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');

    const { id: groupId } = await props.tx.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    await asyncForEach(idsSplit, async serviceId => {
      await props.tx.none(`
        DELETE FROM dbtable_schema.group_services
        WHERE group_id = $1 AND service_id = $2
        RETURNING id
      `, [groupId, serviceId]);
    });

    await props.redis.del(props.event.userSub + `group/${groupName}/services`);

    return idsSplit.map(id => ({ id }));
  }
} as const;

/**
 * @category Group Service
 */
type GroupServicesApi = typeof groupServicesApi;

/**
 * @category Group Service
 */
type GroupServicesApiHandler = typeof groupServicesApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<GroupServicesApi> { }
  interface SiteApiHandlerRef extends Extend<GroupServicesApiHandler> { }
}

Object.assign(siteApiRef, groupServicesApi);
Object.assign(siteApiHandlerRef, groupServicesApiHandlers);