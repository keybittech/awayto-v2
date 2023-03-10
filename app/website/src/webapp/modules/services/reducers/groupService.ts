import { Reducer } from 'redux';
import {
  IGroupServiceState,
  IGroupServiceActions,
  IGroupServiceActionTypes,
  IGroupService,
} from 'awayto';

const initialGroupServiceState = {
  groupServices: new Map()
} as IGroupServiceState;

const groupServicesReducer: Reducer<IGroupServiceState, IGroupServiceActions> = (state = initialGroupServiceState, action) => {
  switch (action.type) {
    case IGroupServiceActionTypes.DELETE_GROUP_SERVICE:
      action.payload.forEach(groupService => {
        state.groupServices.delete(groupService.id);
      });
      return state;
    case IGroupServiceActionTypes.POST_GROUP_SERVICE:
    case IGroupServiceActionTypes.GET_GROUP_SERVICES:
      state.groupServices = new Map([ ...state.groupServices ].concat( action.payload.map(q => [q.id, q]) as readonly [string, IGroupService][] ));
      return state;
    default:
      return state;
  }
};

export default groupServicesReducer;

export const persist = true;