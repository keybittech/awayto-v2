import { Reducer } from 'redux';
import {
  IQuoteState,
  IQuoteActions,
  IQuoteActionTypes,
  IQuote,
  getMapFromArray
} from 'awayto';

const initialQuoteState = {
  quotes: new Map()
} as IQuoteState;

const quoteReducer: Reducer<IQuoteState, IQuoteActions> = (state = initialQuoteState, action) => {
  switch (action.type) {
    case IQuoteActionTypes.DELETE_QUOTE:
    case IQuoteActionTypes.DISABLE_QUOTE:
      action.payload.forEach(quote => {
        state.quotes.delete(quote.id);
      });
      return state;
    case IQuoteActionTypes.PUT_QUOTE:
    case IQuoteActionTypes.POST_QUOTE:
    case IQuoteActionTypes.GET_QUOTE_BY_ID:
    case IQuoteActionTypes.GET_QUOTES:
      state.quotes = getMapFromArray<IQuote>(state.quotes, action.payload);
      return state;
    default:
      return state;
  }
};

export default quoteReducer;

export const persist = true;