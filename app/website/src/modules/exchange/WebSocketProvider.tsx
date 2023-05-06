import React, { useEffect, useMemo, useRef, useState } from 'react';

import { sh, useContexts, useUtil } from 'awayto/hooks';
import { SocketResponse, SocketResponseHandler } from 'awayto/core';

import keycloak from '../../keycloak';

function WebSocketProvider({ children }: IProps): JSX.Element {

  const { setSnack } = useUtil();
  const { WebSocketContext } = useContexts();
  const { data: profile } = sh.useGetUserProfileDetailsQuery();

  const [socket, setSocket] = useState<WebSocket | undefined>();
  const messageListeners = useRef(new Map<string, Set<SocketResponseHandler>>());

  const connect = (username: string) => {

    fetch(`https://${location.hostname}/api/ticket/`, {
      headers: {
        Authorization: keycloak.token || ''
      }
    }).then(() => {

      const ws = new WebSocket(`wss://${location.hostname}/sock/${username}`);

      ws.onopen = () => {
        console.log('socket online');
        setSocket(ws);
      };

      ws.onmessage = (event: MessageEvent<{ text(): Promise<string> }>) => {
        async function go () {
          const { sender, type, topic, payload } = JSON.parse(await event.data.text()) as SocketResponse;

          const listeners = messageListeners.current.get(topic);
    
          if (listeners) {
            for (const listener of listeners) {
              listener({ sender, type, topic, payload });
            }
          }
        }
        void go();
      };
  
      ws.onclose = () => {
        console.log("WebSocket closed. Reconnecting...");
        setTimeout(() => {
          connect(username);
        }, 1000);
      };
  
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
      };

    }).catch(error => {
      const err = error as Error;
      setSnack({ snackOn: err.message, snackType: 'error' });
    });
  }

  useEffect(() => {
    if (profile) {
      connect(profile.username);
    }
  }, [profile]);

  const webSocketContext = {
    connected: socket?.readyState === WebSocket.OPEN,
    sendMessage(type, topic, payload) {
      if (profile && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ sender: profile.username, type, topic, payload }));
      }
    },
    subscribe(topic, callback) {
      const listeners = messageListeners.current.get(topic) || new Set();
      listeners.add(callback);
      messageListeners.current.set(topic, listeners);
  
      return () => {
        listeners.delete(callback);
        if (listeners.size === 0) {
          messageListeners.current.delete(topic);
        }
      };
    },
  } as WebSocketContextType;

  return useMemo(() => !WebSocketContext ? <></> : 
    <WebSocketContext.Provider value={webSocketContext}>
      {children}
    </WebSocketContext.Provider>, 
    [WebSocketContext, webSocketContext]
  );
}

export default WebSocketProvider;