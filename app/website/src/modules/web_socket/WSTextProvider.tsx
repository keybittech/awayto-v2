import React, { useEffect, useMemo, useRef, useState } from 'react';

import Box from '@mui/material/Box';

import { SocketMessage } from 'awayto/core';
import { useComponents, useContexts, useWebSocketSubscribe } from 'awayto/hooks';

declare global {
  interface IProps {
    topicId?: string;
    topicMessages?: SocketMessage[];
    setTopicMessages?(selector: (prop: SocketMessage[]) => SocketMessage[]): SocketMessage[];
  }
}

export function WSTextProvider({ children, topicId, topicMessages, setTopicMessages }: IProps): React.JSX.Element {
  if (!topicId) return <></>;

  const { WSTextContext } = useContexts();

  const { GroupedMessages, SubmitMessageForm } = useComponents();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    participants,
    connectionId,
    connected,
    sendMessage: sendTextMessage
  } = useWebSocketSubscribe<{ message: string, style: SocketMessage['style'] }>(topicId, ({ sender, topic, type, payload }) => {
    console.log('RECEIVED A NEW SOCKET TEXT', { participants, connectionId, sender, topic, type }, JSON.stringify(payload));
    const timestamp = (new Date()).toString();
    const { message, style } = payload;

    const messageParticipant = participants.get(sender);
    
    if (message && style && messageParticipant && setTopicMessages) {
      setTopicMessages(m => [...m, {
        ...messageParticipant,
        sender,
        style,
        message,
        timestamp
      }]);
    }
  });
  
  // Chat auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' })
  }, [messagesEndRef.current, topicMessages]);

  const wsTextContext = {
    wsTextConnectionId: connectionId,
    wsTextConnected: connected,
    messagesEnd: useMemo(() => <Box ref={messagesEndRef} />, []),
    chatLog: useMemo(() => <GroupedMessages topicMessages={topicMessages} />, [topicMessages]),
    submitMessageForm: <SubmitMessageForm
      sendTextMessage={(message: string) => {
        sendTextMessage('text', { style: 'written', message });
      }}
    />
  } as WSTextContextType | null;

  return useMemo(() => !WSTextContext ? <></> :
    <WSTextContext.Provider value={wsTextContext}>
      {children}
    </WSTextContext.Provider>,
    [WSTextContext, wsTextContext]
  );
}

export default WSTextProvider;