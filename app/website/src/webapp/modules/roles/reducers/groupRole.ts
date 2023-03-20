import { Reducer } from 'redux';
import {
  IGroupRoleState,
  IGroupRoleActions,
  IGroupRoleActionTypes,
  IGroupRole,
  getMapFromArray
} from 'awayto';

const initialGroupRoleState = {
  groupRoles: new Map()
} as IGroupRoleState;

const groupRolesReducer: Reducer<IGroupRoleState, IGroupRoleActions> = (state = initialGroupRoleState, action) => {
  switch (action.type) {
    case IGroupRoleActionTypes.DELETE_GROUP_ROLE:
      action.payload.forEach(groupRole => {
        state.groupRoles.delete(groupRole.id);
      });
      return state;
    case IGroupRoleActionTypes.POST_GROUP_ROLE:
    case IGroupRoleActionTypes.PUT_GROUP_ROLE:
    case IGroupRoleActionTypes.GET_GROUP_ROLES:
      state.groupRoles = getMapFromArray<IGroupRole>(state.groupRoles, action.payload);
      return state;
    default:
      return state;
  }
};

export default groupRolesReducer;

export const persist = true;