// useWebSocket.js
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SocketResponseHandler, SocketResponseMessageAttributes } from 'awayto/core';
import { useContexts } from './useContexts';

export function useWebSocketSend() {
  const context = useContext(useContexts().WebSocketContext) as WebSocketContextType;
  return context.sendMessage;
}

export function useWebSocketSubscribe (topic: string, callback: SocketResponseHandler) {

  const { connected, sendMessage, subscribe } = useContext(useContexts().WebSocketContext) as WebSocketContextType;
  const subscribed = useRef(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (connected && !subscribed.current) {
      subscribed.current = true;
      // Subscribe to the topic
      sendMessage('subscribe', topic);

      const unsubscribe = subscribe(topic, payload => {
        callbackRef.current(payload);        
      });

      return () => {
        // Unsubscribe from the topic
        sendMessage('unsubscribe', topic);

        unsubscribe();
      };
    }
  }, [connected, topic]);

  return useMemo(() => ({
    connected,
    sendMessage: (type: string, payload?: Partial<SocketResponseMessageAttributes>) => {
      if (connected) {
        sendMessage(type, topic, payload);
      }
    }
  }), [connected]);
}