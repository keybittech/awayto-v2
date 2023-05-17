import { ApiOptions, EndpointType } from './api';
import { IBooking } from './booking';


/**
 * @category Exchange
 * @purpose participant object for exchanges
 */
export type ExchangeParticipant = {
  name: string;
  role: string;
  color: string;
}

/**
 * @category Exchange
 * @purpose provides structure to chat messages during exchange conversation
 */
export type ExchangeMessage = ExchangeParticipant & {
  style: 'utterance' | 'written';
  action?: () => React.JSX.Element;
  sender: string;
  message: string;
  timestamp: string;
};

/**
 * @category Exchange
 * @purpose maps websocket responses which contain common WebRTC protocol objects
 */
export type ExchangeSessionAttributes = {
  sdp: RTCSessionDescriptionInit | null;
  ice: RTCIceCandidateInit;
  formats: string[];
  message: string;
  style: ExchangeMessage['style'];
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

export default {
  getExchangeParticipant: {
    kind: EndpointType.QUERY,
    url: 'exchange/participant/:connectionId',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { connectionId: '' as string },
    resultType: {} as ExchangeParticipant
  }
} as const;
