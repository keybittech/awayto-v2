import { Merge } from '../util';
import { IFormVersionSubmission } from './form';

declare global {
  interface IMergedState extends Merge<IQuoteState> {}
}

/**
 * @category Quote
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
  quotes: Record<string, IQuote>;
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

const initialQuoteState = {
  quotes: {}
} as IQuoteState;