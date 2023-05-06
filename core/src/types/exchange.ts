import { IBooking } from './booking';

/**
 * @category Exchange
 * @purpose maps websocket responses which contain common WebRTC protocol objects
 */
export type ExchangeSessionAttributes = {
  sdp: RTCSessionDescriptionInit | null;
  ice: RTCIceCandidateInit;
  formats: string[];
  message: string;
  target: string;
};

/**
 * @category Exchange
 * @purpose contains Exchange participant WebRTC stream and connection objects
 */
export type Sender = {
  pc?: RTCPeerConnection;
  mediaStream?: MediaStream;
  peerResponse: boolean;
}

/**
 * @category Exchange
 * @purpose tracks all existing participants in an ongoing Exchange
 */
export type SenderStreams = {
  [prop: string]: Sender
}

/**
 * @category Exchange
 * @purpose parent container for the Exchange UI where users chat, share documents, and participate in voice and video calls
 */
export type IExchange = {
  booking: IBooking;  
};
