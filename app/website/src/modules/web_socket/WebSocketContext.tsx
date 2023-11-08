import { createContext } from 'react';
import { SocketResponseHandler } from 'awayto/core';

declare global {
  type WebSocketContextType = {
    connectionId: string;
    connected: boolean;
    transmit: (store: boolean, action: string, topic: string, payload?: Partial<unknown>) => void;
    subscribe: <T>(topic: string, callback: SocketResponseHandler<T>) => () => void;
  }
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export default WebSocketContext;