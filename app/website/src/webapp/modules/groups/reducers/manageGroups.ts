import { Reducer } from 'redux';
import {
  IManageGroupsState,
  IManageGroupsActionTypes,
  IManageGroupsActions,
  IGroup
} from 'awayto';

const initialManageGroupsState = {
  groups: new Map(),
  isValid: true,
  needCheckName: false,
  checkingName: false,
  checkedName: ''
} as IManageGroupsState;

const manageGroupsReducer: Reducer<IManageGroupsState, IManageGroupsActions> = (state = initialManageGroupsState, action) => {
  switch (action.type) {
    case IManageGroupsActionTypes.DELETE_MANAGE_GROUPS:
    case IManageGroupsActionTypes.DISABLE_MANAGE_GROUPS:
      action.payload.forEach(group => {
        state.groups.delete(group.id);
      });
      return state;
    case IManageGroupsActionTypes.GET_MANAGE_GROUPS:
    case IManageGroupsActionTypes.POST_MANAGE_GROUPS:
    case IManageGroupsActionTypes.PUT_MANAGE_GROUPS:
      state.groups = new Map([ ...state.groups ].concat( action.payload.map(q => [q.id, q]) as readonly [string, IGroup][] ));
      return state;
    case IManageGroupsActionTypes.CHECK_GROUP_NAME:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

export default manageGroupsReducer;