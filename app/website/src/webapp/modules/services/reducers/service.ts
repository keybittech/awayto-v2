import { Reducer } from 'redux';
import {
  IServiceState,
  IServiceActions,
  IServiceActionTypes,
  IService,
  getMapFromArray
} from 'awayto';

const initialServiceState: IServiceState = {
  services: new Map()
};

const servicesReducer: Reducer<IServiceState, IServiceActions> = (state = initialServiceState, action) => {
  switch (action.type) {
    case IServiceActionTypes.DISABLE_SERVICE:
    case IServiceActionTypes.DELETE_SERVICE:
      action.payload.forEach(service => {
        state.services.delete(service.id);
      });
      return state;
    case IServiceActionTypes.PUT_SERVICE:
    case IServiceActionTypes.POST_SERVICE:
    case IServiceActionTypes.GET_SERVICE_BY_ID:
    case IServiceActionTypes.GET_SERVICES:
      state.services = getMapFromArray<IService>(state.services, action.payload);
      return state;
    default:
      return state;
  }
};

export default servicesReducer;

export const persist = true;