import { Reducer } from 'redux';
import {
  IGroupServices,
  IGroupServiceState,
  IGroupServiceActions,
  IGroupServiceActionTypes,
  IGetGroupServicesAction,
  IDeleteGroupServiceAction,
  IPostGroupServiceAction,
} from 'awayto';

const initialGroupServiceState: IGroupServiceState = {
  groupServices: {} as IGroupServices
};

function reduceDeleteGroupService(state: IGroupServiceState, action: IDeleteGroupServiceAction): IGroupServiceState {
  const groupServices = { ...state.groupServices } as IGroupServices;
  action.payload.forEach(groupService => {
    delete groupServices[groupService.id as string];
  });
  state.groupServices = groupServices;
  return { ...state };
}

function reducePostGroupServices(state: IGroupServiceState, action: IPostGroupServiceAction): IGroupServiceState {
  const groupServices = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id as string}`]: b } }), {});
  state.groupServices = { ...state.groupServices, ...groupServices };
  return { ...state };
}

function reduceGetGroupServices(state: IGroupServiceState, action: IGetGroupServicesAction): IGroupServiceState {
  state.groupServices = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id as string}`]: b } }), {});
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