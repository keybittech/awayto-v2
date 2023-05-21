// useWebSocket.js
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SocketParticipant, SocketResponseHandler, deepClone, generateLightBgColor } from 'awayto/core';
import { useContexts } from './useContexts';
import { sh } from './store';

export function useWebSocketSend() {
  const context = useContext(useContexts().WebSocketContext) as WebSocketContextType;
  return context.transmit;
}

export function useWebSocketSubscribe <T>(topic: string, callback: SocketResponseHandler<T>) {

  const {
    connectionId,
    connected,
    transmit,
    subscribe
  } = useContext(useContexts().WebSocketContext) as WebSocketContextType;

  const [subscriber, setSubscriber] = useState<SocketParticipant | undefined>();
  const [unsubscriber, setUnsubscriber] = useState<SocketParticipant | undefined>();
  const [userList, setUserList] = useState<Record<string, SocketParticipant>>({});
  const callbackRef = useRef(callback);

  const [getSocketParticipants] = sh.useLazyGetSocketParticipantsQuery();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (connected) {
      transmit(true, 'subscribe', topic);

      const unsubscribe = subscribe(topic, async message => {
        if (['existing-subscribers', 'subscribe-topic'].includes(message.type)) {
          const subs = await getSocketParticipants({ cids: message.payload as string }).unwrap().catch(console.error);
          if (subs) {
            for (const sub of deepClone(subs)) {
              sub.color = generateLightBgColor();
              setUserList(ul => ({ ...ul, [sub.scid]: sub }));
              setSubscriber(sub);
            }
          }
        } else if ('unsubscribe-topic' === message.type) {
          const unsub = Object.values(userList).find(c => c.cids.includes(message.payload as string))
          if (unsub) {
            delete userList[unsub.scid];
            setUserList(ul => {
              delete ul[unsub.scid];
              return { ...ul };
            });
          }
          setUnsubscriber(unsub);
        } else {
          void callbackRef.current(message);        
        }
      });

      return () => {
        transmit(true, 'unsubscribe', topic);

        unsubscribe();
      };
    }
  }, [transmit, connected, topic]);

  return useMemo(() => ({
    userList,
    subscriber,
    unsubscriber,
    connectionId,
    connected,
    storeMessage: (type: string, payload?: Partial<T>) => {
      if (connected) {
        transmit(true, type, topic, payload);
      }
    },
    sendMessage: (type: string, payload?: Partial<T>) => {
      if (connected) {
        transmit(false, type, topic, payload);
      }
    }
  }), [connectionId, connected, userList, subscriber, unsubscriber]);
}