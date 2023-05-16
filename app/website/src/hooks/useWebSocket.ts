// useWebSocket.js
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SocketResponseHandler } from 'awayto/core';
import { useContexts } from './useContexts';
import { sh } from './store';

export function useWebSocketSend() {
  const context = useContext(useContexts().WebSocketContext) as WebSocketContextType;
  return context.sendMessage;
}

export function useWebSocketSubscribe <T>(topic: string, callback: SocketResponseHandler<T>) {

  const { connectionId, connected, sendMessage, subscribe } = useContext(useContexts().WebSocketContext) as WebSocketContextType;

  const [participants, setParticipants] = useState<Map<string, string>>(new Map());
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (connected) {
      // Subscribe to the topic
      sendMessage('subscribe', topic);

      const unsubscribe = subscribe(topic, payload => {
        if ('join-topic' === payload.type) {
          console.log('caught');
        } else {
          callbackRef.current(payload);        
        }
      });

      return () => {
        // Unsubscribe from the topic
        sendMessage('unsubscribe', topic);

        unsubscribe();
      };
    }
  }, [sendMessage, connected, topic]);

  return useMemo(() => ({
    connectionId,
    connected,
    sendMessage: (type: string, payload?: Partial<T>) => {
      if (connected) {
        sendMessage(type, topic, payload);
      }
    }
  }), [connectionId, connected]);
}