import { Reducer } from 'redux';
import {
  IGroupServiceAddonState,
  IGroupServiceAddonActions,
  IGroupServiceAddonActionTypes,
  IGroupServiceAddon,
} from 'awayto';

const initialGroupServiceAddonState: IGroupServiceAddonState = {
  groupServiceAddons: new Map()
};

const groupServiceAddonsReducer: Reducer<IGroupServiceAddonState, IGroupServiceAddonActions> = (state = initialGroupServiceAddonState, action) => {
  switch (action.type) {
    case IGroupServiceAddonActionTypes.DELETE_GROUP_SERVICE_ADDON:
      action.payload.forEach(groupServiceAddon => {
        state.groupServiceAddons.delete(groupServiceAddon.id);
      });
      return state;
    case IGroupServiceAddonActionTypes.POST_GROUP_SERVICE_ADDON:
    case IGroupServiceAddonActionTypes.GET_GROUP_SERVICE_ADDONS:
      state.groupServiceAddons = new Map([ ...state.groupServiceAddons ].concat( action.payload.map(q => [q.id, q]) as readonly [string, IGroupServiceAddon][] ));
      return state;
    default:
      return state;
  }
};

export default groupServiceAddonsReducer;

export const persist = true;