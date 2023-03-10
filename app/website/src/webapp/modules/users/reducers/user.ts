import { Reducer } from 'redux';
import {
  IUserState,
  IUserActions,
  IUserActionTypes,
  IUserProfile
} from 'awayto';

const initialUserState = {
  users: new Map()
} as IUserState;

const userReducer: Reducer<IUserState, IUserActions> = (state = initialUserState, action) => {
  switch (action.type) {
    case IUserActionTypes.DISABLE_USERS:
    case IUserActionTypes.DELETE_USERS:
      action.payload.forEach(serviceAddon => {
        state.users.delete(serviceAddon.id);
      });
      return state;
    case IUserActionTypes.PUT_USERS:
    case IUserActionTypes.POST_USERS:
    case IUserActionTypes.GET_USERS_BY_ID:
    case IUserActionTypes.GET_USERS:
      state.users = new Map([ ...state.users ].concat( action.payload.map(q => [q.id, q]) as readonly [string, IUserProfile][] ));
      return state;
    default:
      return state;
  }
};

export default userReducer;

export const persist = true;