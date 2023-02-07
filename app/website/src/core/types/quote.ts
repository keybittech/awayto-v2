import { IContact, PayloadAction, IService, IServiceTier } from '.';

declare global {
  /**
   * @category Awayto Redux
   */
  interface ISharedState { 
    quotes: IQuoteState
  }

  /**
   * @category Awayto Redux
   */
  type IQuoteModuleActions = IQuoteActions;

  /**
   * @category Awayto Redux
   */
  interface ISharedActionTypes {
    quotes: IQuoteActionTypes;
  }
}


/**
 * @category Awayto
 */
export type IQuote = {
  id?: string;
  budgetId?: string;
  timelineId?: string;
  serviceTierId?: string;
  contactId?: string;
  name: string;
  respondBy: string;
  description: string;
  desiredDuration: number;
  service?: IService;
  serviceTier?: IServiceTier;
  contact?: IContact;
};

/**
 * @category Quote
 */
export type IQuoteState = Partial<IQuote>;

/**
 * @category Action Types
 */
export enum IQuoteActionTypes {
  POST_QUOTE = "POST/quotes",
  PUT_QUOTE = "PUT/quotes",
  GET_QUOTES = "GET/quotes",
  GET_QUOTE_BY_ID = "GET/quotes/:id",
  DELETE_QUOTE = "DELETE/quotes/:id",
  DISABLE_QUOTE = "PUT/quotes/:id/disable"
}

/**
 * @category Quote
 */
export type IPostQuoteAction = PayloadAction<IQuoteActionTypes.POST_QUOTE, IQuote>;

/**
 * @category Quote
 */
export type IPutQuoteAction = PayloadAction<IQuoteActionTypes.PUT_QUOTE, IQuote>;

/**
 * @category Quote
 */
export type IGetQuotesAction = PayloadAction<IQuoteActionTypes.GET_QUOTES, IQuote>;

/**
 * @category Quote
 */
export type IGetQuoteByIdAction = PayloadAction<IQuoteActionTypes.GET_QUOTE_BY_ID, IQuote>;

/**
 * @category Quote
 */
export type IDeleteQuoteAction = PayloadAction<IQuoteActionTypes.DELETE_QUOTE, IQuoteState>;

/**
 * @category Quote
 */
export type IDisableQuoteAction = PayloadAction<IQuoteActionTypes.DISABLE_QUOTE, IQuoteState>;

/**
 * @category Quote
 */
export type IQuoteActions = IPostQuoteAction 
  | IPutQuoteAction 
  | IGetQuotesAction 
  | IGetQuoteByIdAction
  | IDeleteQuoteAction
  | IDisableQuoteAction;
