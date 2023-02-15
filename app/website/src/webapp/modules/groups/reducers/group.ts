import { Reducer } from 'redux';
import {
  IGroup,
  IGroupState,
  IGroupActions,
  IGroupActionTypes,
  IGetGroupByIdAction,
  IGetGroupsAction,
  IDeleteGroupAction,
  IDisableGroupAction,
  IPostGroupAction,
  IPutGroupAction
} from 'awayto';

const initialGroupState: IGroupState = {
  groups: {} as Record<string, IGroup>,
  users: [],
  checkedName: '',
  availableGroupAssignments: {},
  checkingName: false,
  error: '',
  isValid: true,
  needCheckName: false
};

function reduceDeleteGroup(state: IGroupState, action: IDeleteGroupAction): IGroupState {
  const groups = { ...state.groups };
  action.payload.forEach(group => {
    delete groups[group.id];
  });
  state.groups = groups;
  return { ...state };
}

function reduceGroups(state: IGroupState, action: IGetGroupsAction | IDisableGroupAction | IGetGroupByIdAction | IPostGroupAction | IPutGroupAction): IGroupState {
  const groups = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  state.groups = { ...state.groups, ...groups };
  return { ...state };
}

const groupReducer: Reducer<IGroupState, IGroupActions> = (state = initialGroupState, action) => {
  switch (action.type) {
    case IGroupActionTypes.DELETE_GROUPS:
      return reduceDeleteGroup(state, action);
    case IGroupActionTypes.PUT_GROUPS:
    case IGroupActionTypes.POST_GROUPS:
    case IGroupActionTypes.GET_GROUPS_BY_ID:
    case IGroupActionTypes.DISABLE_GROUPS:
    case IGroupActionTypes.GET_GROUPS:
      return reduceGroups(state, action);
    case IGroupActionTypes.GET_GROUPS_ASSIGNMENTS:
    case IGroupActionTypes.CHECK_GROUPS_NAME:
      return { ...state, ...action.payload }
    default:
      return state;
  }
};

export default groupReducer;

export const persist = true;