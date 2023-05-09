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