import { Extend, Merge, Void } from '../util';
import { IQuote } from './quote';
import { IBooking } from './booking';
import { IGroup } from './group';
import { IRole } from './role';
import { ApiHandler, ApiOptions, EndpointType, siteApiHandlerRef, siteApiRef } from './api';

// declare global {
//   interface IMergedState extends Merge<IUserProfileState> {}
// }

/**
 * @category User Profile
 */
export type UserGroupRoles = Record<string, Record<string, string | string[]>>;

/**
 * @category User Profile
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
  quotesSize: number;
  seenQuotes: boolean;
  bookings: Record<string, IBooking>;
  bookingsSize: number;
  seenBookings: boolean;
  groups: Record<string, IGroup>;
  groupsSize: number;
  roles: Record<string, IRole>;
  rolesSize: number;
  availableUserGroupRoles: UserGroupRoles;
};

// function transformProfile(profile: IUserProfile) {
//   return addSizes(profile, ['groups', 'roles', 'bookings', 'quotes']);
// }

/**
 * @category User Profile
 */
export type IUserProfileState = IUserProfile;

/**
 * @category Action Types
 */
export enum IUserProfileActionTypes {
  POST_USER_PROFILE = "POST/profile",
  PUT_USER_PROFILE = "PUT/profile",
  GET_USER_PROFILE_DETAILS = "GET/profile/details",
  GET_USER_PROFILE_DETAILS_BY_SUB = "GET/profile/details/sub/:sub",
  GET_USER_PROFILE_DETAILS_BY_ID = "GET/profile/details/id/:id",
  DISABLE_USER_PROFILE = "PUT/profile/:id/disable"
}

const userProfileApi = {
  // postUserProfile: {
  //   kind: EndpointType.MUTATION,
  //   url: 'profile',
  //   method: 'POST',
  //   resultType: {} as IUserProfile,
  //   queryArg: {} as IUserProfile,
  // },
  // putUserProfile: {
  //   kind: EndpointType.MUTATION,
  //   url: 'profile',
  //   method: 'PUT',
  //   resultType: {} as IUserProfile,
  //   queryArg: {} as IUserProfile,
  // },
  getUserProfileDetails: {
    kind: EndpointType.QUERY,
    url: 'profile/details',
    method: 'GET',
    opts: { cache: 30 } as ApiOptions,
    queryArg: {} as Void,
    resultType: {} as IUserProfile
    // transformResponse: transformProfile
  },
  // getUserProfileDetailsBySub: {
  //   kind: EndpointType.QUERY,
  //   url: 'profile/details/sub/:sub',
  //   method: 'GET',
  //   queryArg: { sub: '' },
  //   resultType: {} as IUserProfile
  // },
  // getUserProfileDetailsById: {
  //   kind: EndpointType.QUERY,
  //   url: 'profile/details/sub/:sub',
  //   method: 'GET',
  //   queryArg: { id: '' },
  //   resultType: {} as IUserProfile
  // }
} as const;

const userProfileApiHandlers: ApiHandler<typeof userProfileApi> = {
  getUserProfileDetails: async props => {
    const { roleCall, appClient } = await props.redisProxy('roleCall', 'appClient');

    const [user] = await props.db.query<IUserProfile[]>(`
      SELECT * 
      FROM dbview_schema.enabled_users_ext
      WHERE sub = $1
    `, [props.event.userSub]);

    user.availableUserGroupRoles = props.event.availableUserGroupRoles;
    user.username = ' suhd00d'
    try {
      await props.keycloak.users.delClientRoleMappings({
        id: user.sub,
        clientUniqueId: appClient.id!,
        roles: roleCall
      });
    } catch (error) {}

    return user;
  }
} as const;

type UserProfileApi = typeof userProfileApi;
type UserProfileApiHandlers = typeof userProfileApiHandlers;
declare module './api' {
  interface SiteApiRef extends Extend<UserProfileApi> {}
  interface SiteApiHandlerRef extends Extend<UserProfileApiHandlers> {}
}

Object.assign(siteApiRef, userProfileApi);
Object.assign(siteApiHandlerRef, userProfileApiHandlers);
