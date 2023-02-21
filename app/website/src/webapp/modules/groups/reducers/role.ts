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
  IPutRoleAction,
  IRoles
} from 'awayto';

const initialRoleState: IRoleState = {
  roles: {} as IRoles
};

function reduceDeleteRole(state: IRoleState, action: IDeleteRoleAction): IRoleState {
  const roles = { ...state.roles };
  action.payload.forEach(serviceAddon => {
    delete roles[serviceAddon.id];
  });
  state.roles = roles;
  return { ...state };
}

function reduceRoles(state: IRoleState, action: IGetRolesAction | IDisableRoleAction | IGetRoleByIdAction | IPostRoleAction | IPutRoleAction): IRoleState {
  const roles = {} as Record<string, IRole>;
  action.payload.forEach(r => {
    roles[r.id] = r;
  })
  state.roles = { ...state.roles, ...roles };
  return { ...state };
}

const roleReducer: Reducer<IRoleState, IRoleActions> = (state = initialRoleState, action) => {
  switch (action.type) {
    case IRoleActionTypes.DELETE_ROLES:
      return reduceDeleteRole(state, action);
    case IRoleActionTypes.PUT_ROLES:
    case IRoleActionTypes.POST_ROLES:
    case IRoleActionTypes.GET_ROLES_BY_ID:
    case IRoleActionTypes.DISABLE_ROLES:
    case IRoleActionTypes.GET_ROLES:
      return reduceRoles(state, action);
    default:
      return state;
  }
};

export default roleReducer;

export const persist = true;