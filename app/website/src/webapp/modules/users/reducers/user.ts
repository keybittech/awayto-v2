import { Reducer } from 'redux';
import {
  IUserState,
  IUserActions,
  IUserActionTypes,
  IGetUserByIdAction,
  IGetUsersAction,
  IDeleteUserAction,
  IDisableUserAction,
  IPostUserAction,
  IPutUserAction
} from 'awayto';

const initialUserState: IUserState = {
  users: {}
};

function reduceDeleteUser(state: IUserState, action: IDeleteUserAction): IUserState {
  const users = { ...state.users };
  action.payload.forEach(serviceAddon => {
    delete users[serviceAddon.id];
  });
  state.users = users;
  return { ...state };
}

function reduceUsers(state: IUserState, action: IGetUsersAction | IDisableUserAction | IGetUserByIdAction | IPostUserAction | IPutUserAction): IUserState {
  const users = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  state.users = { ...state.users, ...users };
  return { ...state };
}

const userReducer: Reducer<IUserState, IUserActions> = (state = initialUserState, action) => {
  switch (action.type) {
    case IUserActionTypes.DELETE_USERS:
      return reduceDeleteUser(state, action);
    case IUserActionTypes.PUT_USERS:
    case IUserActionTypes.POST_USERS:
    case IUserActionTypes.GET_USERS_BY_ID:
    case IUserActionTypes.DISABLE_USERS:
    case IUserActionTypes.GET_USERS:
      return reduceUsers(state, action);
    default:
      return state;
  }
};

export default userReducer;

export const persist = true;