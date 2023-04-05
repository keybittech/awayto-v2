import { IBooking } from './booking';

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
