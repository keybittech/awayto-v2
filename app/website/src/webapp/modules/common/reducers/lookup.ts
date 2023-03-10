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

const loginReducer: Reducer<ILookupState, ILookupActions> = (state = initialLookupState, action) => {
  switch (action.type) {
    case ILookupActionTypes.GET_LOOKUPS:
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

export default loginReducer;