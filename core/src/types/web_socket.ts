import { ApiOptions, EndpointType } from './api';

/**
 * @category Web Socket
 * @purpose the form of a socket response
 */
export type SocketResponse<T> = {
  store?: boolean;
  sender: string;
  type: string;
  topic: string;
  timestamp: string;
  payload: Partial<T>;
};

/**
 * @category Web Socket
 * @purpose handles topic listener results
 */
export type SocketResponseHandler<T> = (response: SocketResponse<T>) => void | Promise<void>;


/**
 * @category Web Socket
 * @purpose participant object based off anon socket connections
 */
export type SocketParticipant = {
  scid: string; // sock_connection id
  cids: string[]; // connection_id
  name: string;
  role: string;
  color: string;
  exists: boolean;
}

/**
 * @category Web Socket
 * @purpose provides structure to chat messages during interactions
 */
export type SocketMessage = SocketParticipant & {
  style: 'utterance' | 'written';
  action?: () => React.JSX.Element;
  sender: string;
  message: string;
  timestamp: string;
};