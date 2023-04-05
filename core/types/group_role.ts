import { ApiHandler, ApiOptions, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { IRole } from './role';
import { asyncForEach, Extend, Void } from '../util';
import { IGroup } from './group';
import { IGroupService } from './group_service';

/**
 * @category Group Role
 */
export type IGroupRole = IRole & {
  groupId: string;
  roleId: string;
  externalId: string;
}

/**
 * @category Group Role
 */
export type IGroupRoles = Record<string, IGroupRole>;

/**
 * @category Group Role
 */
const groupRoleApi = {
  postGroupRole: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/roles',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string },
    resultType: { success: true as boolean }
  },
  putGroupRole: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/roles',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string },
    resultType: { success: true as boolean }
  },
  getGroupRoles: {
    kind: EndpointType.QUERY,
    url: 'group/:groupName/roles',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string },
    resultType: [] as IGroupRole[]
  },
  deleteGroupRole: {
    kind: EndpointType.MUTATION,
    url: 'group/:groupName/roles/:ids',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { groupName: '' as string, ids: '' as string },
    resultType: [] as { id: string }[]
  },
} as const;

/**
 * @category Group Role
 */
const groupRoleApiHandlers: ApiHandler<typeof groupRoleApi> = {
  postGroupRole: async props => {
    return { success: true };
  },
  putGroupRole: async props => {
    return { success: true };
  },
  getGroupRoles: async props => {
    const { groupName } = props.event.pathParameters;

    const { id: groupId } = await props.db.one<IGroup>(`
      SELECT id
      FROM dbview_schema.enabled_groups
      WHERE name = $1
    `, [groupName]);

    const roles = await props.db.manyOrNone<IGroupRole>(`
      SELECT 
        er.id,
        er.name,
        egr."roleId",
        egr."groupId",
        egr."externalId"
      FROM dbview_schema.enabled_group_roles egr
      JOIN dbview_schema.enabled_roles er ON er.id = egr."roleId"
      WHERE egr."groupId" = $1
    `, [groupId]);

    return roles;
  },
  deleteGroupRole: async props => {
    const { groupName, ids } = props.event.pathParameters;
    const idsSplit = ids.split(',');

    await asyncForEach(idsSplit, async roleId => {
      await props.tx.none(`
        DELETE FROM dbtable_schema.group_roles
        WHERE role_id = $1
      `, [roleId]);
    });

    await props.redis.del(props.event.userSub + `group/${groupName}/roles`);

    return idsSplit.map(id => ({ id }));
  }
} as const;

/**
 * @category Group Role
 */
type GroupRoleApi = typeof groupRoleApi;

/**
 * @category Group Role
 */
type GroupRoleApiHandler = typeof groupRoleApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<GroupRoleApi> { }
  interface SiteApiHandlerRef extends Extend<GroupRoleApiHandler> { }
}

Object.assign(siteApiRef, groupRoleApi);
Object.assign(siteApiHandlerRef, groupRoleApiHandlers);
