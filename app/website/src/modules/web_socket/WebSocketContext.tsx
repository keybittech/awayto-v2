import { createContext } from 'react';
import { SocketResponseHandler } from 'awayto/core';

declare global {
  type WebSocketContextType = {
    connected: boolean;
    sendMessage: (type: string, topic: string, payload?: Partial<unknown>) => void;
    subscribe: <T>(topic: string, callback: SocketResponseHandler<T>) => () => void;
  }
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export default WebSocketContext;