---
title: "Socket Basics"
weight: 3
---

### [&#128279;](#socket-basics) Socket Basics

Real-time communications are supported by a standard Coturn container and a custom WebSocket Server implemented in a NodeJS container. In the React app, you will find corresponding elements which enable the use of voice, video, and text communications. The tree of our React app is constructed in such a way that, as authenticated users begin to render the layout, a React provider/context instantiates a long-lived WebSocket connection for use anywhere in the app. Using the WebSocket context, we get access to the most basic features of a socket connection, which follows a typical topic pub/sub implementation.

```typescript
type WebSocketContextType = {
  connectionId: string;
  connected: boolean;
  transmit: (store: boolean, action: string, topic: string, payload?: Partial<unknown>) => void;
  subscribe: <T>(topic: string, callback: SocketResponseHandler<T>) => () => void;
}
```

- `connectionId`: A one-time global identifier for this connection to the socket server. There is currently no tracking for connections across browser tabs; so if you open a new tab, you will get a new connection id, etc.
- `connected`: Current connection state.
- `transmit`:
  - `store`: Setting `true` will store transmitted messages in the database table `dbtable_schema.topic_messages`.
  - `action`: The type of message as it pertains to functionality of the socket. For example, when creating a chat you might have an action to signify when users `join` or `leave` the chatroom.
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

  // Here we'll instantiate the socket subscription with an arbitrary 'chatId' (which should be the same for all participants), and a very simple payload of { message: string }, which could be any structure necessary depending on the feature being implemented
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
    sendMessage('normal-message', { message }); // It doesn't matter what the type is, but 'normal-message' will be available in the callback of `useWebSocketSubscribe` as `type` for further handling if needed
  }

  return <>
    {/* render the messages */}
  </>
}
```

There is a lot we can accomplish with the `useWebSocketSubscribe` and it can be configured for any pub/sub related context. For a look at more advanced uses of the socket, review the [Call provider]({{< param "repoURL" >}}/blob/main/app/website/src/modules/web_socket/WSCallProvider.tsx), [Text provider]({{< param "repoURL" >}}/blob/main/app/website/src/modules/web_socket/WSTextProvider.tsx) and [Whiteboard component]({{< param "repoURL" >}}/blob/main/app/website/src/modules/exchange/Whiteboard.tsx) to see how multiple actions can be utilized more fully, how to handle subscribers, and more.

#### Less Basic: Socket Authorization and Allowances

The WebSocket protocol does not define any methods for securing the upgrade request necessary to establish a connection between server and client. However, authenticated users will have an ongoing session in our Express API. Therefore we can use it to ensure only authorized users can access the socket by using a ticketing system. Once the user is connected, the socket server can then handle its own requests in seeing which topics the user is allowed to connect to.

In the API, we will find a dedicated set of [routes]({{< param "repoURL" >}}/blob/main/api/src/routes/sock.ts) for use with the socket server. The socket auth flow is as follows:
  - the browser makes a request to `/ticket`
  - the API proxies this request to a ticket creation end point on the socket server, which is keeping track of currently connected subscribers and their tickets/allowances
  - the browser receives a `connectionId:authCode` style pairing from `/ticket` which it uses to make the upgrade request
  - a request is made to the reverse proxy's `/sock` endpoint, configired as an UPGRADE and forwarded to the socket server
  - the socket server checks the incoming `authCode` against what has been stored on the server, expiring the ticket
  - the request is upgraded to a web socket connection and the browser can proceed to send messages using the `connectionId`

After having connected, the client can use the `transmit` function described previously to send a  `'subscribe'` action, along with the desired topic. An abstracted example of this process is used in the `useWebSocketSubscribe` hook.

While subscribing to a topic, the socket server must ensure the user is allowed. This can be done in many different ways depending on the purpose of the socket connection. Currently the only implementation for socket comms is based around the `Exchange` module, which handles meetings between users. Exchanges are a record representing what happens in a meeting. The meeting itself (date, time, participants, etc.) is a separate record called a `Booking`. Users joining an Exchange chatroom are required to be related to that booking record id in the database. This is a complex interaction but ensures participants are valid for a given topic. Using the Exchange module as an example, we'll break down the process here:

1. The users clicks, for example, a link which redirects them to `/app/exchange/:id` using a booking id, which routes them to the Exchange component, and pulls out the ID as a parameter.

2. The Exchange module is wrapped, using either the Text or Call providers, using a relevant topic name and the ID parameter:
```tsx
<WSTextProvider
  topicId={`exchange/text:${exchangeContext.exchangeId}`}
  topicMessages={topicMessages}
  setTopicMessages={setTopicMessages}
>
  <WSCallProvider
    topicId={`exchange/call:${exchangeContext.exchangeId}`}
    topicMessages={topicMessages}
    setTopicMessages={setTopicMessages}
  >
    <ExchangeComponent />
  </WSCallProvider>
</WSTextProvider>
```

3. The text or call provider internally attempts to subscribe to our topicId, e.g. `exchange/text:${exchangeContext.exchangeId}`. The socket server is responsible for checking the users's allowances at the moment of subscription. This process comes together in the socket server's [subscribe]({{< param "repoURL" >}}/blob/main/sock/events/subscribe.js) function.

4. At the start of subscribing, the socket server makes a request to `/api/allowances`. The API returns the list of booking ids which are relevant to the current user and attaches them to the `ws.subscriber.allowances` object.

5. A switch handler makes an arbitrary check to determine if the user has access to the topic id being requested. In the case of the booking/exchange system, this is very basic.

```js
export const exchangeHandler = (ws, parsed) => {

  const [topic, handle] = parsed.topic.split(':');

  switch(topic) {
    case 'exchange/text':
    case 'exchange/call':
    case 'exchange/whiteboard':
      return ws.subscriber.allowances.bookings.includes(handle);
    default:
      return false;
  }
}
```

6. If the handler finds that the user is related to the booking id they are requesting for, the subscribe function continues on with all the wiring up of a user's socket connection.

7. Now inside our Exchange component, we can tap into the text or call contexts.