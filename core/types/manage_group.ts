import { asyncForEach, Extend, Void } from '../util';
import { ApiHandler, ApiOptions, buildUpdate, DbError, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { IGroup } from './group';
import { IGroupRole } from './group_role';
import { utcNowString } from './time_unit';

/**
 * @category Manage Groups
 */
export type IManageGroups = Record<string, IGroup>;

/**
 * @category Manage Groups
 */
const manageGroupsApi = {
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
    resultType: [] as Partial<IGroup>[]
  }
} as const;

/**
 * @category Manage Group
 */
const manageGroupsApiHandlers: ApiHandler<typeof manageGroupsApi> = {
  postManageGroups: async props => {
    try {

      const { name, roles } = props.event.body;

      const group = await props.tx.one<IGroup>(`
        INSERT INTO dbtable_schema.groups (name, created_on, created_sub)
        VALUES ($1, $2, $3::uuid)
        RETURNING id, name
      `, [name, utcNowString(), props.event.userSub]);

      for (const roleId in roles) {
        await props.tx.none(`
          INSERT INTO dbtable_schema.uuid_roles (parent_uuid, role_id, created_on, created_sub)
          VALUES ($1, $2, $3, $4::uuid)
          ON CONFLICT (parent_uuid, role_id) DO NOTHING
        `, [group.id, roleId, utcNowString(), props.event.userSub]);
      }
      
      return { ...group, roles };

    } catch (error) {
      const { constraint } = error as DbError;
      
      if ('unique_group_owner' === constraint) {
        throw { reason: 'Only 1 group can be managed at a time.'}
      }

      throw error;
    }
  },
  putManageGroups: async props => {
    const { id, name, roles } = props.event.body;

    const updateProps = buildUpdate({
      id,
      name,
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });

    const group = await props.tx.one<IGroup>(`
      UPDATE dbtable_schema.groups
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id, name
    `, updateProps.array);

    const roleIds = Object.keys(roles);
    const diffs = (await props.tx.manyOrNone<IGroupRole>('SELECT id, role_id as "roleId" FROM uuid_roles WHERE parent_uuid = $1', [group.id])).filter(r => !roleIds.includes(r.roleId)).map(r => r.id) as string[];

    if (diffs.length) {
      await asyncForEach(diffs, async diff => {
        await props.tx.none('DELETE FROM uuid_roles WHERE id = $1', [diff]);
      });          
    }

    for (const roleId in roles) {
      await props.tx.none(`
        INSERT INTO dbtable_schema.uuid_roles (parent_uuid, role_id, created_on, created_sub)
        VALUES ($1, $2, $3, $4::uuid)
        ON CONFLICT (parent_uuid, role_id) DO NOTHING
      `, [group.id, roleId, utcNowString(), props.event.userSub]);
    }

    return { ...group, roles };
  },
  getManageGroups: async props => {
    const groups = await props.db.manyOrNone<IGroup>(`
      SELECT * FROM dbview_schema.enabled_groups_ext
    `);
    
    return groups;
  },
  deleteManageGroups: async props => {
    const { ids } = props.event.queryParameters;
    const idsSplit = ids.split(',');

    await asyncForEach(idsSplit, async id => {
      await props.tx.none(`
        DELETE FROM dbtable_schema.groups
        WHERE id = $1
      `, [id]);
    })

    return idsSplit.map(id => ({ id }));
  }
} as const;

/**
 * @category Manage Group
 */
type ManageGroupsApi = typeof manageGroupsApi;

/**
 * @category Manage Group
 */
type ManageGroupsApiHandler = typeof manageGroupsApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<ManageGroupsApi> { }
  interface SiteApiHandlerRef extends Extend<ManageGroupsApiHandler> { }
}

Object.assign(siteApiRef, manageGroupsApi);
Object.assign(siteApiHandlerRef, manageGroupsApiHandlers);