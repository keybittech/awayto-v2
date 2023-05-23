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
  const [userList, setUserList] = useState<Map<string, SocketParticipant>>(new Map());
  const callbackRef = useRef(callback);

  const handleSub = (sub: SocketParticipant) => {
    setUserList(ul => {
      const user = ul.get(sub.scid);
      if (user) {
        for (const cid of sub.cids) {
          if (!user.cids.includes(cid)) {
            user.cids.push(cid);
          }
        }
      } else {
        sub.color = generateLightBgColor();
        ul.set(sub.scid, sub);
        setSubscriber(sub);
        console.log(sub.name, 'joined the channel')
      }
      return new Map(ul);
    });
  }

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (connected) {

      const unsubscribe = subscribe(topic, message => {
        if (['existing-subscribers', 'subscribe-topic'].includes(message.type)) {
          for (const sub of message.payload as SocketParticipant[]) {
            handleSub(sub);
          }
          if ('existing-subscribers' === message.type) {
            transmit(false, 'load-messages', topic);
          }
        } else if ('unsubscribe-topic' === message.type) {
          for (const unsub of userList.values()) {
            if (unsub.cids.includes(message.payload as string)) {
              setUserList(ul => {
                ul.delete(unsub.scid);
                return new Map(ul);
              });
              setUnsubscriber(unsub);
            }
          }
        } else {
          void callbackRef.current(message);        
        }
      });

      transmit(true, 'subscribe', topic);

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