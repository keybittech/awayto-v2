import { Reducer } from 'redux';
import {
  IGroupState,
  IGroupActions,
  IGroupActionTypes,
  IGroup
} from 'awayto';

const initialGroupState = {
  groups: new Map(),
  users: new Map(),
  checkedName: '',
  availableGroupAssignments: {},
  checkingName: false,
  error: '',
  isValid: false,
  needCheckName: false
} as IGroupState;

const groupReducer: Reducer<IGroupState, IGroupActions> = (state = initialGroupState, action) => {
  switch (action.type) {
    case IGroupActionTypes.DELETE_GROUPS:
      action.payload.forEach(group => {
        state.groups.delete(group.id);
      });
      return state;
    case IGroupActionTypes.PUT_GROUPS:
    case IGroupActionTypes.POST_GROUPS:
    case IGroupActionTypes.GET_GROUPS_BY_ID:
    case IGroupActionTypes.DISABLE_GROUPS:
    case IGroupActionTypes.GET_GROUPS:
      state.groups = new Map([ ...state.groups ].concat( action.payload.map(q => [q.id, q]) as readonly [string, IGroup][] ));
      return state;
    case IGroupActionTypes.GET_GROUPS_ASSIGNMENTS:
    case IGroupActionTypes.CHECK_GROUPS_NAME:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

export default groupReducer;

export const persist = true;