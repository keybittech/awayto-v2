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
    console.log('deleting thing', groupServiceAddon);
    delete groupServiceAddons[groupServiceAddon.id as string];
  });
  state.groupServiceAddons = groupServiceAddons;
  return { ...state };
}

function reduceGroupServiceAddons(state: IGroupServiceAddonState, action: IGetGroupServiceAddonsAction | IPostGroupServiceAddonAction): IGroupServiceAddonState {
  const groupServiceAddons = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id as string}`]: b } }), {});
  state.groupServiceAddons = { ...state.groupServiceAddons, ...groupServiceAddons };
  return { ...state };
}

const groupServiceAddonsReducer: Reducer<IGroupServiceAddonState, IGroupServiceAddonActions> = (state = initialGroupServiceAddonState, action) => {
  switch (action.type) {
    case IGroupServiceAddonActionTypes.DELETE_GROUP_SERVICE_ADDON:
      return reduceDeleteGroupServiceAddon(state, action);
    case IGroupServiceAddonActionTypes.POST_GROUP_SERVICE_ADDON:
    case IGroupServiceAddonActionTypes.GET_GROUP_SERVICE_ADDONS:
      return reduceGroupServiceAddons(state, action);
    default:
      return state;
  }
};

export default groupServiceAddonsReducer;

export const persist = true;