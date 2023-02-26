import { Reducer } from 'redux';
import {
  IServiceAddon,
  IServiceAddonState,
  IServiceAddonActions,
  IServiceAddonActionTypes,
  IGetServiceAddonByIdAction,
  IGetServiceAddonsAction,
  IDeleteServiceAddonAction,
  IDisableServiceAddonAction,
  IPostServiceAddonAction,
  IPutServiceAddonAction
} from 'awayto';

const initialServiceAddonState: IServiceAddonState = {
  serviceAddons: {} as Record<string, IServiceAddon>
};

function reduceDeleteServiceAddon(state: IServiceAddonState, action: IDeleteServiceAddonAction): IServiceAddonState {
  const serviceAddons = { ...state.serviceAddons };
  action.payload.forEach(serviceAddon => {
    delete serviceAddons[serviceAddon.id];
  });
  state.serviceAddons = serviceAddons;
  return { ...state };
}

function reduceServiceAddons(state: IServiceAddonState, action: IGetServiceAddonsAction | IDisableServiceAddonAction | IGetServiceAddonByIdAction | IPostServiceAddonAction | IPutServiceAddonAction): IServiceAddonState {
  const serviceAddons = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  state.serviceAddons = { ...state.serviceAddons, ...serviceAddons };
  return { ...state };
}

const serviceAddonsReducer: Reducer<IServiceAddonState, IServiceAddonActions> = (state = initialServiceAddonState, action) => {
  switch (action.type) {
    case IServiceAddonActionTypes.DELETE_SERVICE_ADDON:
      return reduceDeleteServiceAddon(state, action);
    case IServiceAddonActionTypes.PUT_SERVICE_ADDON:
    case IServiceAddonActionTypes.POST_SERVICE_ADDON:
    case IServiceAddonActionTypes.GET_SERVICE_ADDON_BY_ID:
      // return reduceServiceAddon(state, action);
    case IServiceAddonActionTypes.DISABLE_SERVICE_ADDON:
    case IServiceAddonActionTypes.GET_SERVICE_ADDONS:
      return reduceServiceAddons(state, action);
    default:
      return state;
  }
};

export default serviceAddonsReducer;

export const persist = true;