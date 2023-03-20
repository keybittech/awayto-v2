import { Reducer } from 'redux';
import {
  IGroupUserState,
  IGroupUserActions,
  IGroupUserActionTypes,
  IGroupUser,
  getMapFromArray
} from 'awayto';

const initialGroupUserState = {
  groupUsers: new Map()
} as IGroupUserState;

const groupUsersReducer: Reducer<IGroupUserState, IGroupUserActions> = (state = initialGroupUserState, action) => {
  switch (action.type) {
    case IGroupUserActionTypes.DELETE_GROUP_USER:
      action.payload.forEach(groupUser => {
        state.groupUsers.delete(groupUser.id);
      });
      return state;
    case IGroupUserActionTypes.LOCK_GROUP_USER:
    case IGroupUserActionTypes.UNLOCK_GROUP_USER:
    case IGroupUserActionTypes.POST_GROUP_USER:
    case IGroupUserActionTypes.PUT_GROUP_USER:
    case IGroupUserActionTypes.GET_GROUP_USER_BY_ID:
    case IGroupUserActionTypes.GET_GROUP_USERS:
      state.groupUsers = getMapFromArray<IGroupUser>(state.groupUsers, action.payload);
      return state;
    default:
      return state;
  }
};

export default groupUsersReducer;

export const persist = true;