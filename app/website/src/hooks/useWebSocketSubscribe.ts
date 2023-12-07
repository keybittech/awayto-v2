// useWebSocket.js
import { useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SocketParticipant, SocketResponseHandler, generateLightBgColor } from 'awayto/core';
import { useContexts } from './useContexts';

export function useWebSocketSend() {
  const context = useContext(useContexts().WebSocketContext) as WebSocketContextType;
  return context.transmit;
}

export function useWebSocketSubscribe<T>(topic: string, callback: SocketResponseHandler<T>) {

  const {
    connectionId,
    connected,
    transmit,
    subscribe
  } = useContext(useContexts().WebSocketContext) as WebSocketContextType;

  const subscriptionChecks = useRef(['subscribe-topic']);
  const [subscribed, setSubscribed] = useState(false);
  const [subscriber, setSubscriber] = useState<SocketParticipant | undefined>();
  const [unsubscriber, setUnsubscriber] = useState<SocketParticipant | undefined>();
  const [userList, setUserList] = useState<Map<string, SocketParticipant>>(new Map());
  const callbackRef = useCallback(callback, [callback]);

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
      }
      return new Map(ul);
    });
  }

  useEffect(() => {
    if (connected) {
      const unsubscribe = subscribe(topic, async (message) => {
        if ('subscribers-existing' === message.action) {
          subscriptionChecks.current = [...subscriptionChecks.current, 'existing-subscribers'];
        } else if (['existing-subscribers', 'subscribe-topic'].includes(message.action)) {

          subscriptionChecks.current = subscriptionChecks.current.filter(sc => sc !== message.action);

          for (const sub of message.payload as SocketParticipant[]) {
            handleSub(sub);
          }

          if (message.sender === connectionId && !subscriptionChecks.current.length) {
            setSubscribed(true);
          }

          if ('existing-subscribers' === message.action) {
            transmit(false, 'load-messages', topic);
          }

        } else if ('unsubscribe-topic' === message.action) {
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
          await callbackRef(message);
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
    subscribed,
    subscriber,
    unsubscriber,
    connectionId,
    connected,
    storeMessage: (action: string, payload?: Partial<T>) => {
      if (connected) {
        transmit(true, action, topic, payload);
      }
    },
    sendMessage: (action: string, payload?: Partial<T>) => {
      if (connected) {
        transmit(false, action, topic, payload);
      }
    }
  }), [connectionId, connected, userList, subscribed, subscriber, unsubscriber]);
}
