import { ApiOptions, EndpointType } from './api';

/**
 * @category Web Socket
 * @purpose the form of a socket response
 */
export type SocketResponse<T> = {
  sender: string;
  type: string;
  topic: string;
  payload: Partial<T>;
};

/**
 * @category Web Socket
 * @purpose handles topic listener results
 */
export type SocketResponseHandler<T> = (response: SocketResponse<T>) => void;


/**
 * @category Web Socket
 * @purpose participant object based off anon socket connections
 */
export type SocketParticipant = {
  name: string;
  role: string;
  color: string;
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

export default {
  getSocketParticipant: {
    kind: EndpointType.QUERY,
    url: 'ws/participant/:connectionId',
    method: 'GET',
    opts: {} as ApiOptions,
    queryArg: { connectionId: '' as string },
    resultType: {} as SocketParticipant
  }
} as const;