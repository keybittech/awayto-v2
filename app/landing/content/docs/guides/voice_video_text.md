---
title: "Voice, Video, and Text"
weight: 4
---

### [Voice, Video, and Text](#voice-video-text)

Communcations functionalities are core to the system, and the platform offers some built-ins to make real-time applications easier to implement. These come in the form of React contexts, so you can build components that work across the application, and aren't tied to any pre-existing components. Unlike the base web socket context, which wraps the application at a high level, these built-ins should be used where needed by wrapping your desired components in the given context's provider. Once familiar with their usage and purpose, it is encouraged to dive deeper by customizing the providers themselves, as they can extend the look and function of the components used internally.

#### Text Messaging Context

```typescript
type WSTextContextType = {
  wsTextConnectionId: string;
  wsTextConnected: boolean;
  chatLog: React.JSX.Element;
  messagesEnd: React.JSX.Element;
  submitMessageForm: React.JSX.Element;
}
```

- `wsTextConnectionId`: The connection id of the underlying socket.
- `wsTextConnected`: The connection status.
- `chatLog`: A styled element containing the chat logs.
- `messagesEnd`: A helper element to "scroll-to-bottom" of the chat log where needed.
- `submitMessageForm`: An input box to submit a message to the channel.

##### Text Provider Usage

As mentioned, to utilize the context, we need to wrap our component with the context's provider, `WSTextProvider`. Upon doing so, the channel can be configured with a unique topic id, which signifies the "room" that our users are joining. As well, we maintain the set of topic messages outside of the provider, so that they can be passed around as necessary to other components. For example, if you nested the call provider inside the text provider, and both of them shared the same topic messages, this would enable the chat components to say things like "John joined the call."

```tsx
import React, { useState, useContext } from 'react';

import Grid from '@mui/material/Grid';

import { SocketMessage } from 'awayto/core';
import { useComponents, useContexts } from 'awayto/hooks';

function ChatLayout(): React.JSX.Element {
  
  const {
    chatLog,
    messagesEnd,
    submitMessageForm
  } = useContext(useContexts().WSTextContext) as WSTextContextType; // Context types are declared globally and don't need to be imported

  return <>
    <Grid container direction="column" sx={{ flex: 1 }}>
      <Grid item sx={{ flex: '1', overflow: 'auto' }}>
        {chatLog}
        {messagesEnd}
      </Grid>

      <Grid item pt={1}>
        {submitMessageForm}
      </Grid>
    </Grid>
  </>;
}

export default function GeneralChat(): React.JSX.Element {

  const { WSTextProvider } = useComponents();

  const [topicMessages, setTopicMessages] = useState<SocketMessage[]>([]);

  return <>
    <WSTextProvider
      topicId={'general-chat'}
      topicMessages={topicMessages}
      setTopicMessages={setTopicMessages}
    >
      <ChatLayout />
    </WSTextProvider>
  </>;
}
```

#### Call Context

The call context sets up the elements needed to manage a WebRTC voice and video call. The socket connection is used internally to route messages to peers in order to setup a peer-connection using the Coturn server. From there, users are directly connected using the WebRTC protocol. The props of the built-in context allow for the construction of a voice and video chatroom components.

```typescript
type WSCallContextType = {
  audioOnly: boolean;
  connected: boolean;
  canStartStop: string;
  localStreamElement: React.JSX.Element;
  senderStreamsElements: (React.JSX.Element | undefined)[];
  setLocalStreamAndBroadcast: (prop: boolean) => void;
  leaveCall: () => void;
}
```

- `audioOnly`: Once a call is started, this flag can be used for various layout needs.
- `connected`: The current status of the call.
- `canStartStop`: This prevents repeated start/stop attempts while a call is already being started/stopped. An empty string means a call is in the process of starting; a value of `'start'` implies there is no ongoing call, `'stop'` means a call has started and can be stopped (using `leaveCall`).
- `localStreamElement`: A component for the current user's own video rendering area.
- `senderStreamsElements`: An array of video components for each peer in the call.
- `setLocalStreamAndBroadcast`: A handler allowing the current user to join the call. Passing `true` will allow video to be sent. Passing nothing or false will only join the call with audio.
- `leaveCall`: A handler to leave a call if currently connected.

##### Call Provider Usage

Much the same as the texting context, we must wrap our call layout using the call provider, `WSCallProvider`. Then we can lay out the components as needed for our call.

```tsx
import React, { useState, useContext } from 'react';

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';

import { SocketMessage } from 'awayto/core';
import { useComponents, useContexts } from 'awayto/hooks';

function CallLayout(): React.JSX.Element {

  const {
    audioOnly,
    connected,
    localStreamElement,
    senderStreamsElements,
    setLocalStreamAndBroadcast,
    leaveCall
  } = useContext(useContexts().WSCallContext) as WSCallContextType; // Context types are declared globally and don't need to be imported

  return <>
    <Grid container direction="column" sx={{ backgroundColor: 'black', position: 'relative', flex: 1 }}>
      {localStreamElement && <Grid item xs={12}
        sx={{
          position: senderStreamsElements.length ? 'absolute' : 'inherit',
          right: 0,
          width: senderStreamsElements.length ? '25%' : '100%'
        }}
      >
        {localStreamElement}
      </Grid>}
      {senderStreamsElements.length && senderStreamsElements}
    </Grid>

    {connected && <Button onClick={() => leaveCall()}>
      Leave Call
    </Button>}

    {!connected || audioOnly && <Button onClick={() => setLocalStreamAndBroadcast(true)}>
      Join with Voice & Video
    </Button>}

    {!connected && <Button onClick={() => setLocalStreamAndBroadcast(false)}>
      Join with Voice
    </Button>}
  </>;
}

export default function GeneralCall () {

  const { WSCallProvider } = useComponents();

  const [topicMessages, setTopicMessages] = useState<SocketMessage[]>([]);

  return <>
    <WSCallProvider
      topicId={'general-call'}
      topicMessages={topicMessages}
      setTopicMessages={setTopicMessages}
    >
      <CallLayout />
    </WSCallProvider>
  </>;
}
```

For our actual implementation and usage of the call and text providers, check out the [Exchange]({{< param "repoURL" >}}/blob/main/app/website/src/modules/exchange/Exchange.tsx) module. There, we combine voice, video, text, as well as a collaborative socket driven canvas.