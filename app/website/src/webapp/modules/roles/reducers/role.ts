import { Reducer } from 'redux';
import {
  IRole,
  IRoleState,
  IRoleActions,
  IRoleActionTypes,
  getMapFromArray
} from 'awayto';

const initialRoleState = {
  roles: new Map()
} as IRoleState;

const roleReducer: Reducer<IRoleState, IRoleActions> = (state = initialRoleState, action) => {
  switch (action.type) {
    case IRoleActionTypes.DISABLE_ROLES:
    case IRoleActionTypes.DELETE_ROLES:
      action.payload.forEach(role => {
        state.roles.delete(role.id);
      });
      return state;
    case IRoleActionTypes.PUT_ROLES:
    case IRoleActionTypes.POST_ROLES:
    case IRoleActionTypes.GET_ROLES_BY_ID:
    case IRoleActionTypes.GET_ROLES:
      state.roles = getMapFromArray<IRole>(state.roles, action.payload);
      return state;
    default:
      return state;
  }
};

export default roleReducer;

export const persist = true;