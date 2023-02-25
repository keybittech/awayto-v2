import { Reducer } from 'redux';
import {
  IGroupServiceState,
  IGroupServiceActions,
  IGroupServiceActionTypes,
  IGetGroupServicesAction,
  IDeleteGroupServiceAction,
  IPostGroupServiceAction,
} from 'awayto';

const initialGroupServiceState = {
  groupServices: {}
} as IGroupServiceState;

function reduceDeleteGroupService(state: IGroupServiceState, action: IDeleteGroupServiceAction): IGroupServiceState {
  const groupServices = { ...state.groupServices };
  action.payload.forEach(groupService => {
    delete groupServices[groupService.id];
  });
  state.groupServices = groupServices;
  return { ...state };
}

function reducePostGroupServices(state: IGroupServiceState, action: IPostGroupServiceAction): IGroupServiceState {
  const groupServices = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  state.groupServices = { ...state.groupServices, ...groupServices };
  return { ...state };
}

function reduceGetGroupServices(state: IGroupServiceState, action: IGetGroupServicesAction): IGroupServiceState {
  state.groupServices = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  return { ...state };
}

const groupServicesReducer: Reducer<IGroupServiceState, IGroupServiceActions> = (state = initialGroupServiceState, action) => {
  switch (action.type) {
    case IGroupServiceActionTypes.DELETE_GROUP_SERVICE:
      return reduceDeleteGroupService(state, action);
    case IGroupServiceActionTypes.POST_GROUP_SERVICE:
      return reducePostGroupServices(state, action);
    case IGroupServiceActionTypes.GET_GROUP_SERVICES:
      return reduceGetGroupServices(state, action);
    default:
      return state;
  }
};

export default groupServicesReducer;

export const persist = true;