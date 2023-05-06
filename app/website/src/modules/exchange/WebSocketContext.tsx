import { createContext } from 'react';
import { SocketResponseHandler, SocketResponseMessageAttributes } from 'awayto/core';

declare global {
  type WebSocketContextType = {
    connected: boolean;
    sendMessage: (type: string, topic: string, payload?: Partial<SocketResponseMessageAttributes>) => void;
    subscribe: (topic: string, callback: SocketResponseHandler) => () => void;
  }
}

export const WebSocketContext = createContext<WebSocketContextType | null>(null);

export default WebSocketContext;