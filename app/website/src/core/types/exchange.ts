import { IBooking, PayloadAction } from '.';
import { Merge } from '../util';

declare global {
  interface IMergedState extends Merge<IExchangeState> {}
}


export type SocketResponseMessageAttributes = {
  sdp: RTCSessionDescriptionInit;
  ice: RTCIceCandidateInit;
  formats: string[];
} & {
  [prop: string]: string;
}

export type Sender = {
  pc?: RTCPeerConnection;
  mediaStream?: MediaStream;
  peerResponse: boolean;
}

export type SenderStreams = {
  [prop: string]: Sender
}


/**
 * @category Awayto
 */
export type IExchange = {
  booking: IBooking;  
};

/**
 * @category Exchange
 */
export type IExchangeState = IExchange & {
  exchanges: Map<string, IExchange>;
};

/**
 * @category Action Types
 */
export enum IExchangeActionTypes {
  POST_EXCHANGE = "POST/exchanges",
  PUT_EXCHANGE = "PUT/exchanges",
  GET_EXCHANGES = "GET/exchanges",
  GET_EXCHANGE_BY_ID = "GET/exchanges/:id",
  DELETE_EXCHANGE = "DELETE/exchanges/:id",
  DISABLE_EXCHANGE = "PUT/exchanges/:id/disable"
}

/**
 * @category Exchange
 */
export type IPostExchangeAction = PayloadAction<IExchangeActionTypes.POST_EXCHANGE, IExchange>;

/**
 * @category Exchange
 */
export type IPutExchangeAction = PayloadAction<IExchangeActionTypes.PUT_EXCHANGE, IExchange>;

/**
 * @category Exchange
 */
export type IGetExchangesAction = PayloadAction<IExchangeActionTypes.GET_EXCHANGES, IExchange>;

/**
 * @category Exchange
 */
export type IGetExchangeByIdAction = PayloadAction<IExchangeActionTypes.GET_EXCHANGE_BY_ID, IExchange>;

/**
 * @category Exchange
 */
export type IDeleteExchangeAction = PayloadAction<IExchangeActionTypes.DELETE_EXCHANGE, IExchangeState>;

/**
 * @category Exchange
 */
export type IDisableExchangeAction = PayloadAction<IExchangeActionTypes.DISABLE_EXCHANGE, IExchangeState>;

/**
 * @category Exchange
 */
export type IExchangeActions = IPostExchangeAction 
  | IPutExchangeAction 
  | IGetExchangesAction 
  | IGetExchangeByIdAction
  | IDeleteExchangeAction
  | IDisableExchangeAction;
