import { Reducer } from 'redux';
import {
  IGetManageRolesAction, 
  IManageRolesActionTypes, 
  IManageRolesState, 
  IPostManageRolesAction, 
  IPutManageRolesAction, 
  IDeleteManageRolesAction, 
  IManageRolesActions,
  IRole
} from 'awayto';

const initialManageRolesState = {
  roles: new Map()
} as IManageRolesState;

const roleReducer: Reducer<IManageRolesState, IManageRolesActions> = (state = initialManageRolesState, action) => {
  switch (action.type) {
    case IManageRolesActionTypes.DELETE_MANAGE_ROLES:
      action.payload.forEach(role => {
        state.roles.delete(role.id);
      });
      return state;
    case IManageRolesActionTypes.PUT_MANAGE_ROLES:
    case IManageRolesActionTypes.POST_MANAGE_ROLES:
    case IManageRolesActionTypes.GET_MANAGE_ROLES:
      state.roles = new Map([ ...state.roles ].concat( action.payload.map(q => [q.id, q]) as readonly [string, IRole][] ));
      return state;
    default:
      return state;
  }
};

export default roleReducer;

export const persist = true;