import { Reducer } from 'redux';
import { 
  IManageRolesActionTypes, 
  IManageRolesState, 
  IManageRolesActions,
  IRole,
  getMapFromArray
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
      state.roles = getMapFromArray<IRole>(state.roles, action.payload);
      return state;
    default:
      return state;
  }
};

export default roleReducer;

export const persist = true;