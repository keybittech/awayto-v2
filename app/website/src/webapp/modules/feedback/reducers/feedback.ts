import { Reducer } from 'redux';
import {
  IFeedback,
  IFeedbackState,
  IFeedbackActions,
  IFeedbackActionTypes,
  getMapFromArray
} from 'awayto';

const initialFeedbackState = {
  feedbacks: new Map()
} as IFeedbackState;

const feedbackReducer: Reducer<IFeedbackState, IFeedbackActions> = (state = initialFeedbackState, action) => {
  switch (action.type) {
    case IFeedbackActionTypes.GET_FEEDBACK:
      state.feedbacks = getMapFromArray<IFeedback>(state.feedbacks, action.payload);
      return state;
    default:
      return state;
  }
};

export default feedbackReducer;

export const persist = true;