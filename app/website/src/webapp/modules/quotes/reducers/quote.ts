import { Reducer } from 'redux';
import {
  IQuoteState,
  IQuoteActions,
  IQuoteActionTypes,
  IGetQuoteByIdAction,
  IGetQuotesAction,
  IDeleteQuoteAction,
  IDisableQuoteAction,
  IPostQuoteAction,
  IPutQuoteAction
} from 'awayto';

const initialQuoteState = {
  quotes: {}
} as IQuoteState;

function reduceDeleteQuote(state: IQuoteState, action: IDeleteQuoteAction): IQuoteState {
  const quotes = { ...state.quotes };
  action.payload.forEach(quote => {
    delete quotes[quote.id];
  });
  state.quotes = quotes;
  return { ...state };
}

function reduceQuotes(state: IQuoteState, action: IGetQuotesAction | IDisableQuoteAction | IGetQuoteByIdAction | IPostQuoteAction | IPutQuoteAction): IQuoteState {
  const quotes = action.payload.reduce((a, b) => ({ ...a, ...{ [`${b.id}`]: b } }), {});
  state.quotes = { ...state.quotes, ...quotes };
  return { ...state };
}

const quoteReducer: Reducer<IQuoteState, IQuoteActions> = (state = initialQuoteState, action) => {
  switch (action.type) {
    case IQuoteActionTypes.DELETE_QUOTE:
      return reduceDeleteQuote(state, action);
    case IQuoteActionTypes.PUT_QUOTE:
    case IQuoteActionTypes.POST_QUOTE:
    case IQuoteActionTypes.GET_QUOTE_BY_ID:
      // return reduceQuote(state, action);
    case IQuoteActionTypes.DISABLE_QUOTE:
    case IQuoteActionTypes.GET_QUOTES:
      return reduceQuotes(state, action);
    default:
      return state;
  }
};

export default quoteReducer;

export const persist = true;