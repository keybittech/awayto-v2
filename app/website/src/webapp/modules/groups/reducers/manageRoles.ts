import { Reducer } from 'redux';
import {
  IRole, 
  IGetManageRolesAction, 
  IManageRolesActionTypes, 
  IManageRolesState, 
  IPostManageRolesAction, 
  IPutManageRolesAction, 
  IDeleteManageRolesAction, 
  IManageRolesActions
} from 'awayto';

const initialManageRolesState: IManageRolesState = {
  roles: {}
};

function reduceDeleteManageRoles(state: IManageRolesState, action: IDeleteManageRolesAction): IManageRolesState {
  const roles = { ...state.roles };
  action.payload.forEach(role => {
    delete roles[role.id];
  });
  state.roles = roles;
  return { ...state };
}

function reduceManageRoles(state: IManageRolesState, action: IGetManageRolesAction | IPostManageRolesAction | IPutManageRolesAction): IManageRolesState {
  const roles = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  state.roles = { ...state.roles, ...roles };
  return { ...state };
}

const roleReducer: Reducer<IManageRolesState, IManageRolesActions> = (state = initialManageRolesState, action) => {
  switch (action.type) {
    case IManageRolesActionTypes.DELETE_MANAGE_ROLES:
      return reduceDeleteManageRoles(state, action);
    case IManageRolesActionTypes.PUT_MANAGE_ROLES:
    case IManageRolesActionTypes.POST_MANAGE_ROLES:
    case IManageRolesActionTypes.GET_MANAGE_ROLES:
      return reduceManageRoles(state, action);
    default:
      return state;
  }
};

export default roleReducer;

export const persist = true;