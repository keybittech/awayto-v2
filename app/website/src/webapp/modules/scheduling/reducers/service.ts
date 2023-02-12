import { Reducer } from 'redux';
import {
  IService,
  IServices,
  IServiceState,
  IServiceActions,
  IServiceActionTypes,
  IGetServiceByIdAction,
  IGetServicesAction,
  IDeleteServiceAction,
  IDisableServiceAction,
  IPostServiceAction,
  IPutServiceAction
} from 'awayto';

const initialServiceState: IServiceState = {
  services: {} as Record<string, IService>
};

function reduceDeleteService(state: IServiceState, action: IDeleteServiceAction): IServiceState {
  const services = { ...state.services } as IServices;
  action.payload.forEach(service => {
    delete services[service.id as string];
  });
  state.services = services;
  return { ...state };
}


function reduceServices(state: IServiceState, action: IGetServicesAction | IDisableServiceAction | IGetServiceByIdAction | IPostServiceAction | IPutServiceAction): IServiceState {
  const services = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id as string}`]: b } }), {});
  state.services = { ...state.services, ...services };
  return { ...state };
}

const servicesReducer: Reducer<IServiceState, IServiceActions> = (state = initialServiceState, action) => {
  switch (action.type) {
    case IServiceActionTypes.DELETE_SERVICE:
      return reduceDeleteService(state, action);
    case IServiceActionTypes.PUT_SERVICE:
    case IServiceActionTypes.POST_SERVICE:
    case IServiceActionTypes.GET_SERVICE_BY_ID:
      // return reduceService(state, action);
    case IServiceActionTypes.DISABLE_SERVICE:
    case IServiceActionTypes.GET_SERVICES:
      return reduceServices(state, action);
    default:
      return state;
  }
};

export default servicesReducer;

export const persist = true;