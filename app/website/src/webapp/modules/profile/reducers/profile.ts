import { Reducer } from 'redux';
import {
  IUserProfileState,
  IUserProfileActionTypes,
  IUserProfileActions,
  IGroup,
  IRole,
  IQuote,
  IBooking
} from 'awayto';

const initialUserProfileState = {
  seenQuotes: true,
  seenBookings: true,
  availableUserGroupRoles: {},
} as Partial<IUserProfileState>;

const profileReducer: Reducer<Partial<IUserProfileState>, IUserProfileActions> = (state = initialUserProfileState, action) => {
  switch (action.type) {
    case IUserProfileActionTypes.GET_USER_PROFILE_DETAILS:
      if (action.payload) {
        action.payload.groups = new Map(Object.entries(action.payload.groups || {}) as Iterable<readonly [string, IGroup]>);
        for (const group of action.payload.groups.values()) {
          group.roles = new Map(Object.entries(group.roles || {}) as Iterable<readonly [string, IRole]>);
        }
        action.payload.roles = new Map(Object.entries(action.payload.roles || {}) as Iterable<readonly [string, IRole]>);
        action.payload.quotes = new Map(Object.entries(action.payload.quotes || {}) as Iterable<readonly [string, IQuote]>);
        action.payload.bookings = new Map(Object.entries(action.payload.bookings || {}) as Iterable<readonly [string, IBooking]>);
      }
      return { ...state, ...action.payload };
    case IUserProfileActionTypes.HAS_CODE:
    case IUserProfileActionTypes.SIGNUP_USER:
    case IUserProfileActionTypes.KC_LOGIN:
    case IUserProfileActionTypes.POST_USER_PROFILE:
    case IUserProfileActionTypes.PUT_USER_PROFILE:
    case IUserProfileActionTypes.GET_USER_PROFILE_DETAILS_BY_SUB:
    case IUserProfileActionTypes.GET_USER_PROFILE_DETAILS_BY_ID:
    case IUserProfileActionTypes.DISABLE_USER_PROFILE:
      return { ...state, ...action.payload };
    default:
      return { ...state };
  }
};

export default profileReducer;