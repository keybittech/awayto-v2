import { Reducer } from 'redux';
import {
  IGroup,
  IGetManageGroupsAction,
  IManageGroupsActionTypes,
  IManageGroupsState,
  IPostManageGroupsAction,
  IPutManageGroupsAction,
  IDeleteManageGroupsAction,
  IManageGroupsActions,
  IDisableManageGroupsAction
} from 'awayto';

const initialManageGroupsState: IManageGroupsState = {
  groups: {},
  isValid: true,
  needCheckName: false,
  checkingName: false,
  checkedName: ''
};

function reduceDeleteManageGroups(state: IManageGroupsState, action: IDeleteManageGroupsAction): IManageGroupsState {
  const groups = { ...state.groups };
  action.payload.forEach(group => {
    delete groups[group.id];
  });
  state.groups = groups;
  return { ...state };
}

function reduceManageGroups(state: IManageGroupsState, action: IGetManageGroupsAction | IPostManageGroupsAction | IPutManageGroupsAction | IDisableManageGroupsAction): IManageGroupsState {
  const groups = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  state.groups = { ...state.groups, ...groups };
  return { ...state };
}

const manageGroupsReducer: Reducer<IManageGroupsState, IManageGroupsActions> = (state = initialManageGroupsState, action) => {
  switch (action.type) {
    case IManageGroupsActionTypes.DELETE_MANAGE_GROUPS:
      return reduceDeleteManageGroups(state, action);
    case IManageGroupsActionTypes.GET_MANAGE_GROUPS:
    case IManageGroupsActionTypes.POST_MANAGE_GROUPS:
    case IManageGroupsActionTypes.PUT_MANAGE_GROUPS:
    case IManageGroupsActionTypes.DISABLE_MANAGE_GROUPS:
      return reduceManageGroups(state, action);
    case IManageGroupsActionTypes.CHECK_GROUP_NAME:
      return { ...state, ...action.payload }
    default:
      return state;
  }
};

export default manageGroupsReducer;