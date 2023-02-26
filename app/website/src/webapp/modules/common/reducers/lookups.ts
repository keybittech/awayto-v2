import { Reducer } from 'redux';
import {
  ILookupState,
  ILookupActions,
  ILookupActionTypes
} from 'awayto';

const initialLookupState: ILookupState = {
  budgets: [],
  timelines: [],
  timeUnits: []
};

function reduceLookup(state: ILookupState, action: ILookupActions): ILookupState {
  return { ...state, ...action.payload };
}

const loginReducer: Reducer<ILookupState, ILookupActions> = (state = initialLookupState, action) => {
  switch (action.type) {
    case ILookupActionTypes.GET_LOOKUPS:
      return reduceLookup(state, action);
    default:
      return state;
  }
};

export default loginReducer;