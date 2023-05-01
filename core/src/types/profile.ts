import { Extend, Void } from '../util';
import { IQuote } from './quote';
import { IBooking } from './booking';
import { IGroup } from './group';
import { IRole } from './role';
import { ApiHandler, ApiOptions, buildUpdate, EndpointType, siteApiHandlerRef, siteApiRef } from './api';
import { utcNowString } from './time_unit';

/**
 * @category User Profile
 */
export type UserGroupRoles = Record<string, Record<string, string | string[]>>;

/**
 * @category User Profile
 * @purpose provides primary attributes for Users as referenced by Groups and Profile functionaly
 */
export type IUserProfile = {
  id: string;
  sub: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  image: string;
  createdOn: string;
  updatedOn: string;
  locked: boolean;
  quotes: Record<string, IQuote>;
  seenQuotes: boolean;
  bookings: Record<string, IBooking>;
  seenBookings: boolean;
  groups: Record<string, IGroup>;
  roles: Record<string, IRole>;
  availableUserGroupRoles: UserGroupRoles;
};
/**
 * @category UserProfile
 */
const userProfileApi = {
  postUserProfile: {
    kind: EndpointType.MUTATION,
    url: 'profile',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { firstName: '' as string, lastName: '' as string, username: '' as string, email: '' as string, image: '' as string, sub: '' as string },
    resultType: { id: '' as string, sub: '' as string, username: '' as string, firstName: '' as string, lastName: '' as string, email: '' as string, image: '' as string }
  },
  putUserProfile: {
    kind: EndpointType.MUTATION,
    url: 'profile',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string, firstName: '' as string, lastName: '' as string, email: '' as string, image: '' as string },
    resultType: { id: '' as string, firstName: '' as string, lastName: '' as string, email: '' as string, image: '' as string }
  },
  getUserProfileDetails: {
    kind: EndpointType.QUERY,
    url: 'profile/details',
    method: 'GET',
    opts: {
      cache: 'skip'
    } as ApiOptions,
    queryArg: {} as Void,
    resultType: {} as IUserProfile
  },
  getUserProfileDetailsBySub: {
    kind: EndpointType.QUERY,
    url: 'profile/details/sub/:sub',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { sub: '' as string },
    resultType: {} as IUserProfile
  },
  getUserProfileDetailsById: {
    kind: EndpointType.QUERY,
    url: 'profile/details/id/:id',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: {} as IUserProfile
  },
  disableUserProfile: {
    kind: EndpointType.MUTATION,
    url: 'profile/:id/disable',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: { id: '' as string },
    resultType: { id: '' as string }
  }
} as const;

/**
 * @category User Profile
 */
const userProfileApiHandlers: ApiHandler<typeof userProfileApi> = {
  postUserProfile: async props => {
    const { firstName, lastName, username, email, image, sub } = props.event.body;

    const user = await props.tx.one<IUserProfile>(`
      INSERT INTO dbtable_schema.users (sub, username, first_name, last_name, email, image, created_on, created_sub, ip_address)
      VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8::uuid, $9)
      RETURNING id, sub, username, first_name as "firstName", last_name as "lastName", email, image
    `, [sub || props.event.userSub, username, firstName, lastName, email, image, utcNowString(), props.event.userSub, props.event.sourceIp]);

    return user;
  },
  putUserProfile: async props => {
    const { id, firstName: first_name, lastName: last_name, email, image } = props.event.body;

    const updateProps = buildUpdate({
      id,
      first_name,
      last_name,
      email,
      image,
      updated_on: utcNowString(),
      updated_sub: props.event.userSub
    });

    const user = await props.tx.one<IUserProfile>(`
      UPDATE dbtable_schema.users
      SET ${updateProps.string}
      WHERE id = $1
      RETURNING id, first_name as "firstName", last_name as "lastName", email, image
    `, updateProps.array);

    try {
      await props.keycloak.users.update({
        id: props.event.userSub
      }, {
        firstName: first_name,
        lastName: last_name
      })
    } catch (error) { }

    await props.redis.del(props.event.userSub + 'profile/details');

    return user;
  },
  getUserProfileDetails: async props => {
    const { roleCall, appClient } = await props.redisProxy('roleCall', 'appClient');

    const profile = await props.db.one<IUserProfile>(`
      SELECT * 
      FROM dbview_schema.enabled_users_ext
      WHERE sub = $1
    `, [props.event.userSub]);

    profile.availableUserGroupRoles = props.event.availableUserGroupRoles;

    try {
      await props.keycloak.users.delClientRoleMappings({
        id: profile.sub,
        clientUniqueId: appClient.id!,
        roles: roleCall
      });
    } catch (error) { }

    return profile;
  },
  getUserProfileDetailsBySub: async props => {
    const { sub } = props.event.pathParameters;

    const profile = await props.db.one<IUserProfile>(`
      SELECT * FROM dbview_schema.enabled_users
      WHERE sub = $1 
    `, [sub]);

    return profile;
  },
  getUserProfileDetailsById: async props => {
    const { id } = props.event.pathParameters;

    const profile = await props.db.one<IUserProfile>(`
      SELECT * FROM dbview_schema.enabled_users
      WHERE id = $1 
    `, [id]);

    return profile;
  },
  disableUserProfile: async props => {
    const { id } = props.event.pathParameters;

    await props.tx.none(`
      UPDATE dbtable_schema.users
      SET enabled = false, updated_on = $2, updated_sub = $3
      WHERE id = $1
    `, [id, utcNowString(), props.event.userSub]);

    return { id };
  }
} as const;

/**
* @category User Profile
*/
type UserProfileApi = typeof userProfileApi;

/**
* @category User Profile
*/
type UserProfileApiHandler = typeof userProfileApiHandlers;

declare module './api' {
  interface SiteApiRef extends Extend<UserProfileApi> { }
  interface SiteApiHandlerRef extends Extend<UserProfileApiHandler> { }
}

Object.assign(siteApiRef, userProfileApi);
Object.assign(siteApiHandlerRef, userProfileApiHandlers);
