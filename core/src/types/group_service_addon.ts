import { Extend } from '../util';
import { ApiHandler, ApiOptions, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { IGroup } from './group';
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
const groupServiceAddonApi = {
  postGroupServiceAddon: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/service_addons/:serviceAddonId',
    method: 'POST',
    opts: {} as ApiOptions,
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
    opts: {} as ApiOptions,
    queryArg: {
      groupName: '' as string,
      serviceAddonId: '' as string
    },
    resultType: [{ id: '' as string }]
  }
} as const;

/**
 * @category Group Service Addon
 */
const groupServiceAddonApiHandlers: ApiHandler<typeof groupServiceAddonApi> = {
  postGroupServiceAddon: async props => {
    const { groupName, serviceAddonId } = props.event.pathParameters;

    const { id: groupId } = await props.tx.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    await props.tx.none(`
      INSERT INTO dbtable_schema.uuid_service_addons (parent_uuid, service_addon_id, created_sub)
      VALUES ($1, $2, $3::uuid)
      ON CONFLICT (parent_uuid, service_addon_id) DO NOTHING
    `, [groupId, serviceAddonId, props.event.userSub]);

    await props.redis.del(props.event.userSub + `group/${groupName}/service_addons`);

    return [];
  },
  getGroupServiceAddons: async props => {
    const { groupName } = props.event.pathParameters;

    const { id: groupId } = await props.db.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    const groupServiceAddons = await props.db.manyOrNone<IGroupServiceAddon>(`
      SELECT esa.*, eusa."parentUuid" as "groupId"
      FROM dbview_schema.enabled_uuid_service_addons eusa
      LEFT JOIN dbview_schema.enabled_service_addons esa ON esa.id = eusa."serviceAddonId"
      WHERE eusa."parentUuid" = $1
    `, [groupId]);

    return groupServiceAddons;
  },
  deleteGroupServiceAddon: async props => {
    const { groupName, serviceAddonId } = props.event.pathParameters;

    const { id: groupId } = await props.tx.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    await props.tx.none(`
      DELETE FROM dbtable_schema.uuid_service_addons
      WHERE parent_uuid = $1 AND service_addon_id = $2
    `, [groupId, serviceAddonId]);

    await props.redis.del(props.event.userSub + `group/${groupName}/service_addons`);

    return [{ id: serviceAddonId }];
  }
} as const;

/**
 * @category Group Service Addon
 */
type GroupServiceAddonApi = typeof groupServiceAddonApi;

/**
 * @category Group Service Addon
 */
type GroupServiceAddonApiHandler = typeof groupServiceAddonApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<GroupServiceAddonApi> { }
  interface SiteApiHandlerRef extends Extend<GroupServiceAddonApiHandler> { }
}

Object.assign(siteApiRef, groupServiceAddonApi);
Object.assign(siteApiHandlerRef, groupServiceAddonApiHandlers);