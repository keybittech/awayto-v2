import { Void } from '../util';
import { IQuote } from './quote';
import { IBooking } from './booking';
import { IGroup } from './group';
import { IRole } from './role';
import { ApiOptions, EndpointType } from './api';

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
  active: boolean;
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
export default {
  postUserProfile: {
    kind: EndpointType.MUTATION,
    url: 'profile',
    method: 'POST',
    opts: {} as ApiOptions,
    queryArg: { firstName: '' as string, lastName: '' as string, username: '' as string, email: '' as string, image: '' as string, sub: '' as string },
    resultType: { success: true as boolean }
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
  },
  activateProfile: {
    kind: EndpointType.MUTATION,
    url: 'profile/activate',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: { success: true as boolean }
  },
  deactivateProfile: {
    kind: EndpointType.MUTATION,
    url: 'profile/deactivate',
    method: 'PUT',
    opts: {} as ApiOptions,
    queryArg: {} as Void,
    resultType: { success: true as boolean }
  }
} as const;