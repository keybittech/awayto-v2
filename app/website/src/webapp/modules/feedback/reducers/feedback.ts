import { Reducer } from 'redux';
import {
  IFeedback,
  IFeedbackState,
  IFeedbackActions,
  IFeedbackActionTypes
} from 'awayto';

const initialFeedbackState = {
  feedbacks: new Map()
} as IFeedbackState;

const feedbackReducer: Reducer<IFeedbackState, IFeedbackActions> = (state = initialFeedbackState, action) => {
  switch (action.type) {
    case IFeedbackActionTypes.GET_FEEDBACK:
      state.feedbacks = new Map([ ...state.feedbacks ].concat( action.payload.map(q => [q.id, q]) as readonly [string, IFeedback][] ));
      return state;
    default:
      return state;
  }
};

export default feedbackReducer;

export const persist = true;