// useWebSocket.js
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ExchangeParticipant, SocketResponse, SocketResponseHandler, generateLightBgColor } from 'awayto/core';
import { useContexts } from './useContexts';
import { sh } from './store';

export function useWebSocketSend() {
  const context = useContext(useContexts().WebSocketContext) as WebSocketContextType;
  return context.sendMessage;
}

export function useWebSocketSubscribe <T>(topic: string, callback: SocketResponseHandler<T>) {

  const { connectionId, connected, sendMessage, subscribe } = useContext(useContexts().WebSocketContext) as WebSocketContextType;

  const [participantPayload, setParticipantPayload] = useState<SocketResponse<unknown> | undefined>();
  const [participants, setParticipants] = useState<Map<string, ExchangeParticipant>>(new Map());
  const callbackRef = useRef(callback);

  const { data: participant } = sh.useGetExchangeParticipantQuery({ connectionId: participantPayload?.sender || '' }, { skip: !participantPayload });

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (connected) {
      // Subscribe to the topic
      sendMessage('subscribe', topic);

      const unsubscribe = subscribe(topic, payload => {
        if ('join-topic' === payload.type) {
          setParticipantPayload(payload);
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
  
  useEffect(() => {
    if (participant && participantPayload) {
      const existingParticipant = participants.get(participantPayload.sender);
      setParticipants(p => {
        p.set(participantPayload.sender, existingParticipant ? { ...existingParticipant, ...participant, ...participantPayload } : { ...participant, color: generateLightBgColor() });
        return p;
      })
    }
  }, [participant, participantPayload, participants])

  return useMemo(() => ({
    participants,
    connectionId,
    connected,
    sendMessage: (type: string, payload?: Partial<T>) => {
      if (connected) {
        sendMessage(type, topic, payload);
      }
    }
  }), [connectionId, connected, participant, participantPayload]);
}