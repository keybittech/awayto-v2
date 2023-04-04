import { Merge } from '../util';
import { IBooking } from './booking';

declare global {
  interface IMergedState extends Merge<IExchangeState> {}
}

/**
 * @category Exchange
 */
export type SocketResponseMessageAttributes = {
  sdp: RTCSessionDescriptionInit;
  ice: RTCIceCandidateInit;
  formats: string[];
} & {
  [prop: string]: string;
}

/**
 * @category Exchange
 */
export type Sender = {
  pc?: RTCPeerConnection;
  mediaStream?: MediaStream;
  peerResponse: boolean;
}

/**
 * @category Exchange
 */
export type SenderStreams = {
  [prop: string]: Sender
}

/**
 * @category Exchange
 */
export type IExchange = {
  booking: IBooking;  
};

/**
 * @category Exchange
 */
export type IExchangeState = IExchange & {
  exchanges: Record<string, IExchange>;
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