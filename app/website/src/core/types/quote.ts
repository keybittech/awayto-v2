import { PayloadAction, IFormVersionSubmission } from '.';
import { Merge } from '../util';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    quote: IQuoteState
  }

  interface IMergedState extends Merge<unknown, IQuoteState> {}

  /**
   * @category Awayto Redux
   */
  type IQuoteModuleActions = IQuoteActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    quote: IQuoteActionTypes;
  }
}


/**
 * @category Awayto
 */
export type IQuote = {
  id: string;
  slotDate: string;
  startTime: string;
  username: string;
  serviceTierId: string;
  serviceTierName: string;
  serviceName: string;
  scheduleBracketSlotId: string;
  serviceFormVersionSubmissionId: string;
  tierFormVersionSubmissionId: string;
  serviceForm?: IFormVersionSubmission;
  tierForm?: IFormVersionSubmission;
  createdSub: string;
  createdOn: string;
};

/**
 * @category Quote
 */
export type IQuoteState = IQuote & {
  quotes: Map<string, IQuote>;
};

/**
 * @category Action Types
 */
export enum IQuoteActionTypes {
  POST_QUOTE = "POST/quotes",
  PUT_QUOTE = "PUT/quotes",
  GET_QUOTES = "GET/quotes",
  GET_QUOTE_BY_ID = "GET/quotes/:id",
  DELETE_QUOTE = "DELETE/quotes/:id",
  DISABLE_QUOTE = "PUT/quotes/disable/:ids"
}

/**
 * @category Quote
 */
export type IPostQuoteAction = PayloadAction<IQuoteActionTypes.POST_QUOTE, IQuote[]>;

/**
 * @category Quote
 */
export type IPutQuoteAction = PayloadAction<IQuoteActionTypes.PUT_QUOTE, IQuote[]>;

/**
 * @category Quote
 */
export type IGetQuotesAction = PayloadAction<IQuoteActionTypes.GET_QUOTES, IQuote[]>;

/**
 * @category Quote
 */
export type IGetQuoteByIdAction = PayloadAction<IQuoteActionTypes.GET_QUOTE_BY_ID, IQuote[]>;

/**
 * @category Quote
 */
export type IDeleteQuoteAction = PayloadAction<IQuoteActionTypes.DELETE_QUOTE, IQuote[]>;

/**
 * @category Quote
 */
export type IDisableQuoteAction = PayloadAction<IQuoteActionTypes.DISABLE_QUOTE, IQuote[]>;

/**
 * @category Quote
 */
export type IQuoteActions = IPostQuoteAction 
  | IPutQuoteAction 
  | IGetQuotesAction 
  | IGetQuoteByIdAction
  | IDeleteQuoteAction
  | IDisableQuoteAction;
