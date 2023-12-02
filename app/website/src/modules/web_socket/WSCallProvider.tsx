import React, { useRef, useCallback, useMemo, useState } from 'react';

import { useComponents, useContexts, useUtil, useWebSocketSubscribe } from 'awayto/hooks';
import { ExchangeSessionAttributes, Sender, SenderStreams, SocketMessage } from 'awayto/core';

const {
  REACT_APP_TURN_NAME,
  REACT_APP_TURN_PASS
} = process.env as { [prop: string]: string };

const peerConnectionConfig = {
  'iceServers': [
    { urls: `turn:${location.hostname}:3478`, credential: 'turnpass', username: 'turnuser' },
    { urls: `stun:${location.hostname}:3478` },
  ]
};

declare global {
  interface IProps {
    topicId?: string;
    topicMessages?: SocketMessage[];
    setTopicMessages?(selector: (prop: SocketMessage[]) => SocketMessage[]): void;
  }
}

export function WSCallProvider({ children, topicId, setTopicMessages }: IProps): React.JSX.Element {
  if (!topicId) return <>{children}</>;

  const { WSCallContext } = useContexts();
  const { setSnack } = useUtil();

  const { Video } = useComponents();

  // const speechRecognizer = useRef<SpeechRecognition>();
  
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [connected, setConnected] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);
  const [canStartStop, setCanStartStop] = useState('start');
  const senderStreams = useRef<SenderStreams>({});

  const {
    userList,
    connectionId,
    sendMessage
  } = useWebSocketSubscribe<ExchangeSessionAttributes>(topicId, async ({ sender, topic, action, payload }) => {
    const timestamp = (new Date()).toString();
    const { formats, target, sdp, ice, message, style } = payload;

    if (sender === connectionId || (target !== connectionId && !(formats || sdp || ice || message))) {
      return;
    }

    console.log({ userList, [action.toUpperCase()]: { connectionId, sender, formats, sdp, ice, message } });

    if ('text' === action && setTopicMessages && message && style) {
      for (const user of userList.values()) {
        if (user.cids.includes(sender)) {
          setTopicMessages(m => [...m, {
            ...user,
            sender,
            style,
            message,
            timestamp
          }]);
        }
      }
    } else if (['join-call', 'peer-response'].includes(action)) {
      // Parties to an incoming caller's 'join-call' will see this, and then notify the caller that they exist in return
      // The caller gets a party member's 'peer-response', and sets them up in return
      if (formats && setTopicMessages) {
        for (const user of userList.values()) {
          if (user.cids.includes(sender)) {
            setTopicMessages(m => [...m, {
              ...user,
              sender,
              style: 'utterance',
              message: `Joined call with ${formats.indexOf('video') > -1 ? 'video' : 'voice'}.`,
              timestamp
            }]);
          } 
        }
      }

      const startedSender: Sender = {
        peerResponse: 'peer-response' === action ? true : false
      };

      startedSender.pc = new RTCPeerConnection(peerConnectionConfig)

      startedSender.pc.onicecandidate = event => {
        if (event.candidate !== null) {
          sendMessage('rtc', { ice: event.candidate, target: sender });
        }
      };

      startedSender.pc.ontrack = event => {
        startedSender.mediaStream = startedSender.mediaStream ? startedSender.mediaStream : new MediaStream();
        startedSender.mediaStream.addTrack(event.track);
        Object.assign(senderStreams.current, { [sender]: startedSender });
      };

      startedSender.pc.oniceconnectionstatechange = () => {
        if (startedSender.pc && ['failed', 'closed', 'disconnected'].includes(startedSender.pc.iceConnectionState)) {
          delete senderStreams.current[sender];
        }
      }

      if (localStream) {
        const tracks = localStream.getTracks();
        tracks.forEach(track => startedSender.pc?.addTrack(track));
      }

      if (startedSender.peerResponse) {
        const desc = await startedSender.pc.createOffer();
        await startedSender.pc?.setLocalDescription(desc);
        sendMessage('rtc', {
          sdp: startedSender.pc?.localDescription,
          target: sender
        });
      } else {
        sendMessage('peer-response', {
          target: sender
        });
      }

      Object.assign(senderStreams.current, { [sender]: startedSender });
    } else if (sdp) {
      const senderStream = senderStreams.current[sender];

      if (senderStream && senderStream.pc) {
        await senderStream.pc?.setRemoteDescription(new RTCSessionDescription(sdp));
        if ('offer' === sdp.type) {
          const desc = await senderStream.pc?.createAnswer();
          await senderStream.pc?.setLocalDescription(desc);
          sendMessage('rtc', {
            sdp: senderStream.pc?.localDescription,
            target: sender
          });
        }
      }
    } else if (ice) {
      const senderStream = senderStreams.current[sender];
      console.log({ senderStream });
      if (senderStream && senderStream.pc && senderStream.pc.remoteDescription && !['failed', 'closed', 'disconnected'].includes(senderStream.pc.iceConnectionState)) {
        await senderStream.pc.addIceCandidate(new RTCIceCandidate(ice));
      }
    }
  });

  // const trackStream = (mediaStream: MediaStream) => {

  //   const mediaRecorder = new MediaRecorder(mediaStream);
  //   const chunks: BlobPart[] = [];

  //   // Listen for dataavailable event to obtain the recorded data
  //   mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
  //     chunks.push(event.data);
  //   });

  //   // Set the recording duration to 10 seconds
  //   const RECORDING_DURATION_MS = 10000;
  //   mediaRecorder.start(RECORDING_DURATION_MS);

  //   // Speech recognition setup
  //   speechRecognizer.current = new window.webkitSpeechRecognition();
  //   speechRecognizer.current.maxAlternatives = 5;
  //   speechRecognizer.current.continuous = true;
  //   speechRecognizer.current.interimResults = true;
  //   speechRecognizer.current.lang = navigator.language;

  //   // const isSpeaking = false;
  //   // const silenceStartTime = 0;

  //   // Handle speech recognition results
  //   speechRecognizer.current.addEventListener('result', (event: SpeechRecognitionEvent) => {
  //     const lastResult = event.results[event.results.length - 1];
  //     const { transcript } = lastResult[0];

  //     const isFinal = lastResult.isFinal;

  //     // Check if the user is speaking or not
  //     if (isFinal && transcript.length) {
        
  //       // getPrompt({ id: IPrompts.TRANSLATE, prompt: `${target}|Chinese Simplified|${transcript}`}).unwrap().then(({ promptResult: [translated] }) => {
  //       //   sendMessage('text', { style: 'utterance', message: translated.split('Translation:')[1] });
  //       // }).catch(console.error);

  //       sendMessage('text', { style: 'utterance', message: transcript });
  //     }
  //   });

  //   speechRecognizer.current.start();
  // };

  const setLocalStreamAndBroadcast = useCallback((video: boolean): void => {
    async function go() {
      try {
        if (!localStream && 'start' === canStartStop) {
          setCanStartStop('');
          setAudioOnly(!video);

          const callOptions: MediaStreamConstraints = {
            audio: {
              autoGainControl: true
            }
          };

          if (video) {
            callOptions.video = {
              width: 520,
              height: 390,
              frameRate: { max: 30 }
            };
          }
          const mediaStream = await navigator.mediaDevices.getUserMedia(callOptions);
          // trackStream(mediaStream); -- TODO: Check support for this in browsers some day
          setLocalStream(mediaStream);
          sendMessage('join-call', { formats: Object.keys(callOptions) });
          setCanStartStop('stop');
          setConnected(true);
        }
      } catch (error) {
        setCanStartStop('start');
        setSnack({ snackOn: (error as DOMException).message, snackType: 'error' });
      }
    }
    void go();
  }, [localStream, canStartStop]);

  const localStreamRef = useCallback((node: HTMLVideoElement) => {
    if (node && !node.srcObject && localStream) {
      node.srcObject = localStream
    }
  }, [localStream]);

  const wsTextContext = {
    audioOnly,
    connected,
    canStartStop,
    setLocalStreamAndBroadcast,
    leaveCall() {
      if (localStream) {
        localStream.getTracks().forEach(t => {
          localStream.removeTrack(t);
          t.stop();
        });
        const streams = { ...senderStreams.current };
        Object.keys(streams).forEach(sender => {
          const senderStream = senderStreams.current[sender];
          if (senderStream && senderStream.pc) {
            senderStream.pc.close();
            senderStream.mediaStream = undefined;
          }
        });
        senderStreams.current = streams;
        setLocalStream(undefined);
        setCanStartStop('start');
        setConnected(false);
        // speechRecognizer.current?.stop();
        // speechRecognizer.current = undefined;
      }
    },
    senderStreamsElements: useMemo(() => Object.keys(senderStreams.current).map(sender => {
      if (senderStreams.current[sender].mediaStream) {
        return <Video key={sender} autoPlay srcObject={senderStreams.current[sender].mediaStream} />
      }
    }), [senderStreams.current, localStream, localStreamRef]),
    localStreamElement: useMemo(() => localStream && !senderStreams.current.length ? <video key={'local-video'} style={{ width: '100%' }} autoPlay controls ref={localStreamRef} /> : undefined, [localStream, localStreamRef])
  } as WSCallContextType | null;

  return useMemo(() => !WSCallContext ? <></> :
    <WSCallContext.Provider value={wsTextContext}>
      {children}
    </WSCallContext.Provider>,
    [WSCallContext, wsTextContext]
  );
}

export default WSCallProvider;
