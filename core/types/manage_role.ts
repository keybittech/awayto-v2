import { Extend } from '../util';
import { ApiHandler, ApiOptions, buildUpdate, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { IRole } from './role';
import { utcNowString } from './time_unit';

/**
 * @category Manage Roles
 */
export type IManageRoles = Record<string, IRole>;

/**
 * @category Manage Roles
 */
const manageRolesApi = {
  postManageRoles: {
    kind: EndpointType.MUTATION,
    url: 'manage/roles',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { name: '' as string },
    resultType: { id: '' as string, name: '' as string }
  },
  putManageRoles: {
    kind: EndpointType.MUTATION,
    url: 'manage/roles',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, name: '' as string },
    resultType: { id: '' as string, name: '' as string }
  },
  getManageRoles: {
    kind: EndpointType.QUERY,
    url: 'manage/roles',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: {} as Record<string, never>,
    resultType: [] as IRole[]
  },
  deleteManageRoles: {
    kind: EndpointType.MUTATION,
    url: 'manage/roles',
    method: 'DELETE',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;

/**
 * @category Manage Roles
 */
const manageRolesApiHandlers: ApiHandler<typeof manageRolesApi> = {
  postManageRoles: async props => {
    const { name } = props.event.body;

    const role = await props.tx.one<IRole>(`
      INSERT INTO dbtable_schema.roles (name, created_sub)
      VALUES ($1, $2::uuid)
      RETURNING id, name
    `, [name, props.event.userSub]);

    return role;
  },
  putManageRoles: async props => {
    const { id, name } = props.event.body;

    const updateProps = buildUpdate({
      id,
      name,
      updated_sub: props.event.userSub,
      updated_on: utcNowString()
    });

    const role = await props.tx.one<IRole>(`
      UPDATE dbtable_schema.roles
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id, name
    `, updateProps.array);

    return role;
  },
  getManageRoles: async props => {
    const roles = await props.db.manyOrNone<IRole>(`
      SELECT * FROM dbview_schema.enabled_roles
    `);

    return roles;
  },
  deleteManageRoles: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      DELETE FROM dbtable_schema.roles
      WHERE id = $1
    `, [id]);

    return { id };
  }
} as const;

/**
 * @category Manage Roles
 */
type ManageRolesApi = typeof manageRolesApi;

/**
 * @category Manage Roles
 */
type ManageRolesApiHandler = typeof manageRolesApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<ManageRolesApi> { }
  interface SiteApiHandlerRef extends Extend<ManageRolesApiHandler> { }
}

Object.assign(siteApiRef, manageRolesApi);
Object.assign(siteApiHandlerRef, manageRolesApiHandlers);
