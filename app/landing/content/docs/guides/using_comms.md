---
title: "Using Communications"
weight: 3
---

### [Using Communications](#using-communications)

Real-time communications are supported by a standard Coturn container and a custom WebSocket Server implemented in a NodeJS container. In the React app, you will find corresponding elements which enable the use of voice, video, and text communications. The tree of our React app is constructed in such a way that, as authenticated users begin to render the layout, a React provider/context instantiates a long-lived WebSocket connection for use anywhere in the app. Using the WebSocket context, we get access to the most basic features of a socket connection, which follows a typical pub/sub implementation.

```typescript
type WebSocketContextType = {
  connectionId: string;
  connected: boolean;
  transmit: (store: boolean, type: string, topic: string, payload?: Partial<unknown>) => void;
  subscribe: <T>(topic: string, callback: SocketResponseHandler<T>) => () => void;
}
```

- `connectionId`: A one-time global identifier for this connection to the socket server. There is currently no tracking for connections across browser tabs; so if you open a new tab, you will get a second connection, etc.
- `connected`: Current connection state.
- `transmit`:
  - `store`: Setting `true` will store transmitted messages in the database table `dbtable_schema.topic_messages`. This could be useful for example in a chatroom setting, where you want to later retrieve chat history based on topics. 
  - `type`: The type of message as it pertains to functionality of the socket. For example, when creating a chat you might have a message types to signify when users `join` or `leave` the chatroom.
  - `topic`: The channel or room in which messages will be sent.
  - `payload`: The message being sent. Generally a simple key/value pair.
- `subscribe`: Join a user to a specific topic and set up a callback for how messages receipts should be handled on the client. A type can be supplied in order to specify the type of payload that is returned in the callback.

The WebSocket context itself is pretty low level, and there are still some very generic usecases we can cover with high-level abstractions, such as managing client-side connections, disconnections, and user lists. For this we make use of a React hook that is more readily usable, `useWebSocketSubscribe`. Here is a trivial but complete implementation of the hook to see how it can be used:

```tsx
import React, { useState } from 
import { useWebSocketSubscribe } from 'awayto/hooks';

declare global {
  interface IProps {
    chatId?: string;
  }
}

export function UserChat({ chatId }: IProps): React.JSX.Element {

  const [messages, setMessages] = useState([])

  const {
    userList,
    subscriber,
    unsubscriber,
    connectionId,
    connected,
    storeMessage,
    sendMessage
  } = useWebSocketSubscribe<{ message: string }>(chatId, ({ timestamp, type, topic, sender, store, payload }) => {
    
    // Received a new message
    const { message } = payload;

    // A single user could have multiple connections,
    // so we need to iterate over their connection ids and then extend our messages collection
    for (const user of userList.values()) {
      if (user.cids.includes(sender)) {
        setMessages(m => [...m, {
          sender,
          message,
          timestamp
        }]);
      }
    }
    
  });

  useEffect(() => {
    // Someone joined the chat
  }, [subscriber]);

  useEffect(() => {
    // Someone left the chat
  }, [unsubscriber]);

  const messageHandler = (message: string) => {
    // To store the message in the database
    storeMessage('stored-message', { message }); // This { message } payload is bound by the type supplied to `useWebSocketSubscribe`

    // Or just send a message between clients
    sendMessage('normal-message', { message }); // It doesn't matter what the type is, but 'normal-message' will be available in the callback of `useWebSocketSubscribe` for further handling if needed
  }

  return <>
    {/* render the messages */}
  </>
}

```

