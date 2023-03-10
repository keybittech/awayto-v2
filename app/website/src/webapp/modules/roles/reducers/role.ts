import { Reducer } from 'redux';
import {
  IRole,
  IRoleState,
  IRoleActions,
  IRoleActionTypes,
  IGetRoleByIdAction,
  IGetRolesAction,
  IDeleteRoleAction,
  IDisableRoleAction,
  IPostRoleAction,
  IPutRoleAction
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
      state.roles = new Map([ ...state.roles ].concat( action.payload.map(q => [q.id, q]) as readonly [string, IRole][] ));
      return state;
    default:
      return state;
  }
};

export default roleReducer;

export const persist = true;