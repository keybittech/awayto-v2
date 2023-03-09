import { Reducer } from 'redux';
import {
  IUserProfileState,
  IUserProfileActionTypes,
  IUserProfileActions
} from 'awayto';

const initialUserProfileState: Partial<IUserProfileState> = {
  groups: {},
  roles: {},
  quotes: {},
  availableUserGroupRoles: {}
};

const profileReducer: Reducer<Partial<IUserProfileState>, IUserProfileActions> = (state = initialUserProfileState, action) => {
  if (action.payload) {
    if (!action.payload.groups) action.payload.groups = {};
    if (!action.payload.roles) action.payload.roles = {};
    if (!action.payload.quotes) action.payload.quotes = {};
    if (!action.payload.availableUserGroupRoles) action.payload.availableUserGroupRoles = {};
  }

  switch (action.type) {
    case IUserProfileActionTypes.HAS_CODE:
    case IUserProfileActionTypes.SIGNUP_USER:
    case IUserProfileActionTypes.KC_LOGIN:
    case IUserProfileActionTypes.POST_USER_PROFILE:
    case IUserProfileActionTypes.PUT_USER_PROFILE:
    case IUserProfileActionTypes.GET_USER_PROFILE_DETAILS:
    case IUserProfileActionTypes.GET_USER_PROFILE_DETAILS_BY_SUB:
    case IUserProfileActionTypes.GET_USER_PROFILE_DETAILS_BY_ID:
    case IUserProfileActionTypes.DISABLE_USER_PROFILE:
      return { ...state, ...action.payload };
    default:
      return { ...state };
  }
};

export default profileReducer;