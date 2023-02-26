import { Reducer } from 'redux';
import {
  IGroupServiceAddons,
  IGroupServiceAddonState,
  IGroupServiceAddonActions,
  IGroupServiceAddonActionTypes,
  IGetGroupServiceAddonsAction,
  IDeleteGroupServiceAddonAction,
  IPostGroupServiceAddonAction,
} from 'awayto';

const initialGroupServiceAddonState: IGroupServiceAddonState = {
  groupServiceAddons: {} as IGroupServiceAddons
};

function reduceDeleteGroupServiceAddon(state: IGroupServiceAddonState, action: IDeleteGroupServiceAddonAction): IGroupServiceAddonState {
  const groupServiceAddons = { ...state.groupServiceAddons };
  action.payload.forEach(groupServiceAddon => {
    delete groupServiceAddons[groupServiceAddon.id];
  });
  state.groupServiceAddons = groupServiceAddons;
  return { ...state };
}

function reducePostGroupServiceAddons(state: IGroupServiceAddonState, action: IPostGroupServiceAddonAction): IGroupServiceAddonState {
  const groupServiceAddons = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  state.groupServiceAddons = { ...state.groupServiceAddons, ...groupServiceAddons };
  return { ...state };
}

function reduceGetGroupServiceAddons(state: IGroupServiceAddonState, action: IGetGroupServiceAddonsAction): IGroupServiceAddonState {
  state.groupServiceAddons = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  return { ...state };
}

const groupServiceAddonsReducer: Reducer<IGroupServiceAddonState, IGroupServiceAddonActions> = (state = initialGroupServiceAddonState, action) => {
  switch (action.type) {
    case IGroupServiceAddonActionTypes.DELETE_GROUP_SERVICE_ADDON:
      return reduceDeleteGroupServiceAddon(state, action);
    case IGroupServiceAddonActionTypes.POST_GROUP_SERVICE_ADDON:
      return reducePostGroupServiceAddons(state, action);
    case IGroupServiceAddonActionTypes.GET_GROUP_SERVICE_ADDONS:
      return reduceGetGroupServiceAddons(state, action);
    default:
      return state;
  }
};

export default groupServiceAddonsReducer;

export const persist = true;