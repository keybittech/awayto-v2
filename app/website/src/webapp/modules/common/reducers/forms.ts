import { Reducer } from 'redux';
import {
  IFormState,
  IFormActions,
  IFormActionTypes
} from 'awayto';

const initialFormState: IFormState = {
  budgets: [],
  timelines: [],
  scheduleContexts: []
};

function reduceForm(state: IFormState, action: IFormActions): IFormState {
  return { ...state, ...action.payload };
}

const loginReducer: Reducer<IFormState, IFormActions> = (state = initialFormState, action) => {
  switch (action.type) {
    case IFormActionTypes.GET_FORMS:
      return reduceForm(state, action);
    default:
      return state;
  }
};

export default loginReducer;