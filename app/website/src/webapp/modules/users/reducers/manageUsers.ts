import { Reducer } from 'redux';
import {
  IUserProfile,
  IManageUsersState,
  IManageUsersActionTypes,
  IManageUsersActions,
  IGetManageUsersAction,
  IGetManageUsersInfoAction,
  ILockManageUsersAction,
  IPostManageUsersAction,
  IPutManageUsersAction,
  IUnlockManageUsersAction,
  IPostManageUsersSubAction,
  IPostManageUsersAppAcctAction,
  IGetManageUsersByIdAction,
  IGetManageUsersBySubAction
} from 'awayto';

const initialManageUsersState: IManageUsersState = {
  users: {}
};

function reduceManageUsers(state: IManageUsersState, action: IGetManageUsersAction | IGetManageUsersInfoAction | ILockManageUsersAction | IPostManageUsersAction | IPutManageUsersAction | IUnlockManageUsersAction | IPostManageUsersSubAction | IPostManageUsersAppAcctAction | IGetManageUsersByIdAction | IGetManageUsersBySubAction): IManageUsersState {
  const users = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  state.users = { ...state.users, ...users };
  return { ...state };
}

const manageUsersReducer: Reducer<IManageUsersState, IManageUsersActions> = (state = initialManageUsersState, action) => {
  switch (action.type) {
    case IManageUsersActionTypes.GET_MANAGE_USERS:
    case IManageUsersActionTypes.POST_MANAGE_USERS:
    case IManageUsersActionTypes.GET_MANAGE_USERS_BY_ID:
    case IManageUsersActionTypes.GET_MANAGE_USERS_BY_SUB:
    case IManageUsersActionTypes.POST_MANAGE_USERS_APP_ACCT:
    case IManageUsersActionTypes.POST_MANAGE_USERS_SUB:
    case IManageUsersActionTypes.PUT_MANAGE_USERS:
    case IManageUsersActionTypes.LOCK_MANAGE_USERS:
    case IManageUsersActionTypes.UNLOCK_MANAGE_USERS:
    case IManageUsersActionTypes.GET_MANAGE_USERS_INFO:
      return reduceManageUsers(state, action);
    default:
      return state;
  }
};

export default manageUsersReducer;