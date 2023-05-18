// useWebSocket.js
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SocketParticipant, SocketResponseHandler, generateLightBgColor } from 'awayto/core';
import { useContexts } from './useContexts';
import { sh } from './store';

export function useWebSocketSend() {
  const context = useContext(useContexts().WebSocketContext) as WebSocketContextType;
  return context.sendMessage;
}

export function useWebSocketSubscribe <T>(topic: string, callback: SocketResponseHandler<T>) {

  const {
    connectionId,
    connected,
    sendMessage,
    subscribe
  } = useContext(useContexts().WebSocketContext) as WebSocketContextType;

  const [subscriber, setSubscriber] = useState<SocketParticipant | undefined>();
  const [unsubscriber, setUnsubscriber] = useState<SocketParticipant | undefined>();
  const [userList, setUserList] = useState<Record<string, SocketParticipant>>({});
  const callbackRef = useRef(callback);

  const [getSocketParticipant] = sh.useLazyGetSocketParticipantQuery();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (connected) {
      sendMessage('subscribe', topic);

      const unsubscribe = subscribe(topic, async message => {
        if (['existing-subscribers', 'subscribe-topic'].includes(message.type)) {
          const cids = (message.payload as string).split(',');
          for (const cid of cids) {
            const details = await getSocketParticipant({ connectionId: cid }).unwrap().catch(console.error);
            if (details) {
              const sub = {
                ...details,
                cids: [cid],
                color: generateLightBgColor()
              };
              setUserList(ul => {
                ul[sub.scid] = sub;
                return { ...ul };
              });
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
        sendMessage('unsubscribe', topic);

        unsubscribe();
      };
    }
  }, [sendMessage, connected, topic]);

  return useMemo(() => ({
    userList,
    subscriber,
    unsubscriber,
    connectionId,
    connected,
    sendMessage: (type: string, payload?: Partial<T>) => {
      if (connected) {
        sendMessage(type, topic, payload);
      }
    }
  }), [connectionId, connected, userList, subscriber, unsubscriber]);
}