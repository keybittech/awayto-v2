import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';

import Send from '@mui/icons-material/Send';

import { ExchangeMessage, ExchangeSessionAttributes, SenderStreams } from 'awayto/core';
import { useComponents, useContexts, useUtil, useWebSocketSubscribe } from 'awayto/hooks';
import { useParams } from 'react-router';

const peerConnectionConfig = {
  'iceServers': [
    { urls: `turn:${location.hostname}:3478`, credential: 'test123', username: 'test' },
    { urls: `stun:${location.hostname}:3478` },
  ]
};

export function ExchangeProvider({ children }: IProps): React.JSX.Element {

  const { exchangeId } = useParams();
  if (!exchangeId) return <></>;

  const { ExchangeContext } = useContexts();

  const { setSnack } = useUtil();

  const { Video, GroupedMessages } = useComponents();

  const speechRecognizer = useRef<SpeechRecognition>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [textMessage, setTextMessage] = useState('');
  const [messages, setMessages] = useState<ExchangeMessage[]>([]);

  const trackStream = (mediaStream: MediaStream) => {

    const mediaRecorder = new MediaRecorder(mediaStream, { mimeType: 'audio/webm' });
    const chunks: BlobPart[] = [];

    // Listen for dataavailable event to obtain the recorded data
    mediaRecorder.addEventListener('dataavailable', (event: BlobEvent) => {
      chunks.push(event.data);
    });

    // Set the recording duration to 10 seconds
    const RECORDING_DURATION_MS = 10000;
    mediaRecorder.start(RECORDING_DURATION_MS);

    // Speech recognition setup
    speechRecognizer.current = new window.webkitSpeechRecognition();
    speechRecognizer.current.maxAlternatives = 5;
    speechRecognizer.current.continuous = true;
    speechRecognizer.current.interimResults = true;
    speechRecognizer.current.lang = 'en-US';

    // const isSpeaking = false;
    // const silenceStartTime = 0;

    // Handle speech recognition results
    speechRecognizer.current.addEventListener('result', (event: SpeechRecognitionEvent) => {
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript;

      const isFinal = lastResult.isFinal;

      // Check if the user is speaking or not
      if (isFinal) {
        sendExchangeMessage('text', { style: 'utterance', message: transcript });
      }
    });

    speechRecognizer.current.start();
  }

  const [localStream, setLocalStream] = useState<MediaStream>();
  const [canStartStop, setCanStartStop] = useState('start');
  const [senderStreams, setSenderStreams] = useState<SenderStreams>({});

  const {
    connectionId,
    connected,
    sendMessage: sendExchangeMessage
  } = useWebSocketSubscribe<ExchangeSessionAttributes>(exchangeId, ({ sender, topic, type, payload }) => {
    console.log('RECEIVED A NEW SOCKET MESSAGE', { connectionId, sender, topic, type }, JSON.stringify(payload));
    
    const { formats, target, sdp, ice, message, style } = payload;

    if (target !== connectionId && !(formats || sdp || ice || message)) {
      return;
    }

    if ('text' === type && message && style) {
      setMessages(msgs => [...msgs, { style, sender: sender.split('@')[0], message, timestamp: (new Date()).toString() }]);
    } else if (sender !== connectionId) {
      if (['join-call', 'peer-response'].includes(type)) {
        // Parties to an incoming caller's 'join-call' will see this, and then notify the caller that they exist in return
        // The caller gets a party member's 'peer-response', and sets them up in return
        if (!localStream && formats) {
          setMessages([...messages, { style: 'utterance', sender, message: `Start a ${formats.indexOf('video') > -1 ? 'video' : 'voice'} call.`, timestamp: (new Date()).toString() } ]);
        }

        const senders = Object.keys(senderStreams).filter(sender => !senderStreams[sender].pc);
        const startedSenders: SenderStreams = {};

        for (const senderId of senders) {
          const startedSender = senderStreams[senderId];

          if (connected) {

            startedSender.pc = new RTCPeerConnection(peerConnectionConfig)

            startedSender.pc.onicecandidate = event => {
              if (event.candidate !== null) {
                sendExchangeMessage('rtc', { ice: event.candidate, target: senderId });
              }
            };

            startedSender.pc.ontrack = event => {
              startedSender.mediaStream = startedSender.mediaStream ? startedSender.mediaStream : new MediaStream();
              startedSender.mediaStream.addTrack(event.track);
              setSenderStreams(Object.assign({}, senderStreams, { [senderId]: startedSender }));
            };

            startedSender.pc.oniceconnectionstatechange = () => {
              if (startedSender.pc && ['failed', 'closed', 'disconnected'].includes(startedSender.pc.iceConnectionState)) {
                const streams = { ...senderStreams };
                delete streams[senderId];
                setSenderStreams(streams);
              }
            }

            if (localStream) {
              const tracks = localStream.getTracks();
              tracks.forEach(track => startedSender.pc?.addTrack(track));
            }

            if ('peer-response' === type) {
              const { createOffer, setLocalDescription, localDescription } = startedSender.pc;
              createOffer().then(description => {
                setLocalDescription(description).then(() => {
                  sendExchangeMessage('rtc', {
                    sdp: localDescription,
                    target: senderId
                  });
                }).catch(console.error);
              }).catch(console.error);
            } else {
              sendExchangeMessage('peer-response', {
                target: senderId
              });
            }

            startedSenders[senderId] = startedSender;
          }
        }
      } else if (sdp) {
        const senderStream = senderStreams[sender];

        if (senderStream && senderStream.pc) {
          const { createAnswer, setRemoteDescription, setLocalDescription, localDescription } = senderStream.pc;
          setRemoteDescription(new RTCSessionDescription(sdp)).then(() => {
            if ('offer' === sdp.type) {
              createAnswer().then(description => {
                setLocalDescription(description).then(() => {
                  sendExchangeMessage('rtc', {
                    sdp: localDescription,
                    target: sender
                  });
                }).catch(console.error);
              }).catch(console.error);
            }
          }).catch(console.error);
        }
      } else if (ice) {
        const senderStream = senderStreams[sender];
        if (senderStream && senderStream.pc && !['failed', 'closed', 'disconnected'].includes(senderStream.pc.iceConnectionState)) {
          senderStream.pc.addIceCandidate(new RTCIceCandidate(ice)).catch(console.error);
        }
      }
    }
  });

  const setLocalStreamAndBroadcast = useCallback((video: boolean): void => {
    async function go() {
      try {
        if (connected && !localStream && 'start' === canStartStop) {
          setCanStartStop('');

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
          trackStream(mediaStream);
          setLocalStream(mediaStream);
          sendExchangeMessage('join-call', { formats: Object.keys(callOptions) });
          setCanStartStop('stop');
        }
      } catch (error) {
        setSnack({ snackOn: (error as DOMException).message, snackType: 'error' });
      }
    }
    void go();
  }, [connected, localStream, canStartStop]);

  const localStreamRef = useCallback((node: HTMLVideoElement) => {
    if (node && !node.srcObject && localStream) {
      node.srcObject = localStream
    }
  }, [localStream]);

  // Chat auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' })
  }, [messagesEndRef.current, messages]);

  const sendTextMessage = () => {
    sendExchangeMessage('text', { style: 'written', message: textMessage });
    setTextMessage('');
  }

  const exchangeContext = {
    canStartStop,
    messagesEnd: useMemo(() => <Box ref={messagesEndRef} />, []),
    chatLog: useMemo(() => <GroupedMessages exchangeMessages={messages} />, [messages]),
    setLocalStreamAndBroadcast,
    leaveCall() {
      if (localStream) {
        localStream.getTracks().forEach(t => {
          localStream.removeTrack(t);
          t.stop();
        });
        const streams = { ...senderStreams };
        Object.keys(streams).forEach(sender => {
          const senderStream = senderStreams[sender];
          if (senderStream && senderStream.pc) {
            senderStream.pc.close();
            senderStream.mediaStream = undefined;
          }
        });
        setSenderStreams(streams);
        setLocalStream(undefined);
        setCanStartStop('start');
        speechRecognizer.current?.stop();
        speechRecognizer.current = undefined;
      }
    },
    senderStreamsElements: useMemo(() => Object.keys(senderStreams).map(sender => {
      if (senderStreams[sender].mediaStream) {
        return <Video key={sender} autoPlay srcObject={senderStreams[sender].mediaStream} />
      }
    }), [senderStreams]),
    localStreamElement: useMemo(() => !localStream ? undefined : <video key={'local-video'} style={{ width: '25%' }} autoPlay controls ref={localStreamRef} />, [localStream, localStreamRef]),

    submitMessageForm: useMemo(() => {
      return <form onSubmit={e => {
        e.preventDefault();
        sendTextMessage();
      }}>
        <TextField
          fullWidth
          multiline
          id="message"
          label="Message"
          value={textMessage}
          name="message"
          onChange={e => setTextMessage(e.target.value)}
          InputProps={{
            onKeyDown: e => {
              if ('Enter' === e.key && !e.shiftKey) {
                e.preventDefault();
                sendTextMessage();
              }
            },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton type="submit" aria-label="toggle password visibility">
                  <Send />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </form>
    }, [textMessage])
  } as ExchangeContextType | null;

  return useMemo(() => !ExchangeContext ? <></> :
    <ExchangeContext.Provider value={exchangeContext}>
      {children}
    </ExchangeContext.Provider>,
    [ExchangeContext, exchangeContext]
  );
}

export default ExchangeProvider;