import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';

import Send from '@mui/icons-material/Send';

import { asyncForEach, Sender, SenderStreams, SocketResponseMessageAttributes } from 'awayto/core';
import { useComponents, useUtil } from 'awayto/hooks';

import { ExchangeContext, ExchangeContextType } from './ExchangeContext';
import keycloak from '../../keycloak';

const peerConnectionConfig = {
  'iceServers': [
    { urls: `turn:${location.hostname}:3478`, credential: 'test123', username: 'test' },
    { urls: `stun:${location.hostname}:3478` },
  ]
};

function heartbeat(this: { [prop: string]: ReturnType<typeof setTimeout> }) {
  clearTimeout(this.pingTimeout);
  this.pingTimeout = setTimeout(function () {
    console.log('hb')
  }, 30000 + 1000);
}

function clearbeat(this: WebSocket & { [prop: string]: ReturnType<typeof setTimeout> }) {
  clearTimeout(this.pingTimeout);
}

export function ExchangeProvider({ children }: IProps): JSX.Element {

  const localId = `test-${(new Date).getTime()}`;

  const { setSnack } = useUtil();

  const { Video } = useComponents();

  const socket = useRef<WebSocket>();
  const speechRecognizer = useRef<SpeechRecognition>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [textMessage, setTextMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [pendingMessages, setPendingMessages] = useState<string[]>([]);


  const [localStream, setLocalStream] = useState<MediaStream>();
  const [canStartStop, setCanStartStop] = useState('start');
  const [senderStreams, setSenderStreams] = useState<SenderStreams>({});

  const [pendingSDPs, setPendingSDPs] = useState<{ [prop: string]: RTCSessionDescriptionInit }>({});
  const [pendingICEs, setPendingICEs] = useState<{ [prop: string]: RTCIceCandidateInit }>({});

  const trackStream = (mediaStream: MediaStream) => {

    const mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: 'audio/webm'
    });
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
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      const lastResult = event.results[event.results.length - 1];
      // console.log(lastResult)
      const isFinal = lastResult.isFinal;
      // const confidence = lastResult[0].confidence;
      // const isSilence = lastResult[0].transcript === '';

      // console.log({ transcript })

      // Check if the user is speaking or not
      if (isFinal) {
        sendMessage(transcript);
      }
    });

    speechRecognizer.current.start();
  }

  const setLocalStreamAndBroadcast = useCallback((video: boolean): void => {
    async function go() {
      try {
        if (socket.current && !localStream && localId && 'start' === canStartStop) {
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
          socket.current.send(JSON.stringify({
            sender: localId,
            type: 'join-call',
            formats: Object.keys(callOptions),
            rtc: true
          }));
          setCanStartStop('stop');
        }
      } catch (error) {
        setSnack({ snackOn: (error as DOMException).message, snackType: 'error' });
      }
    }
    void go();
  }, [socket.current, localStream, canStartStop, localId]);

  const submitMessage = useCallback((e?: KeyboardEvent | FormEvent): void => {
    e && e.preventDefault();
    if (!socket.current || !textMessage) return;
    try {
      sendMessage(textMessage);
    } catch (error) {
      setSnack({ snackOn: error as string });
    }
  }, [socket.current, messages, textMessage]);

  const sendMessage = function(message: string) {
    socket.current?.send(JSON.stringify({
      sender: localId,
      type: 'text',
      message: message
    }));
    setTextMessage('');
    // setMessages([...messages, textMessage]);
  }

  const messageHandler = useCallback((sockMsg: MessageEvent<{ text(): Promise<string> }>): void => {
    async function go() {
      // console.log('setting handler')
      if (!socket.current) return;
      const { sender, type, formats, target, sdp, ice, message, rtc } = JSON.parse(await sockMsg.data.text()) as SocketResponseMessageAttributes;
  
      if (sender === localId || (target !== localId && !(rtc || sdp || ice || message))) {
        return;
      }
  
      if ('text' === type) {
        setPendingMessages([message]);
      } else if (['join-call', 'peer-response'].includes(type)) {
        // Parties to an incoming caller's 'join-call' will see this, and then notify the caller that they exist in return
        // The caller gets a party member's 'peer-response', and sets them up in return
        if (!localStream && formats) {
          setPendingMessages([`${sender} wants to start a ${formats.indexOf('video') > -1 ? 'video' : 'voice'} call.`])
        }
  
        setSenderStreams(Object.assign({}, senderStreams, {
          [sender]: {
            peerResponse: 'peer-response' === type ? true : false
          }
        }));
      } else if (sdp) {
        setPendingSDPs(Object.assign({}, pendingSDPs, {
          [sender]: sdp
        }));
      } else if (ice) {
        setPendingICEs(Object.assign({}, pendingICEs, {
          [sender]: ice
        }));
      }
    }
    void go();
  }, [socket.current, messages, senderStreams]);


  function gotIceCandidate(event: RTCPeerConnectionIceEvent, sender: string) {
    if (socket.current && event.candidate !== null) {
      socket.current.send(JSON.stringify({
        ice: event.candidate,
        sender: localId,
        target: sender,
        rtc: true
      }));
    }
  }

  const gotRemoteStream = useCallback((event: RTCTrackEvent, id: string, sender: Sender) => {
    sender.mediaStream = sender.mediaStream ? sender.mediaStream : new MediaStream();
    sender.mediaStream.addTrack(event.track);
    setSenderStreams(Object.assign({}, senderStreams, { [id]: sender }));
  }, [senderStreams]);

  const checkPeerDisconnect = useCallback((id: string, sender: Sender) => {
    if (sender.pc) {
      if (['failed', 'closed', 'disconnected'].includes(sender.pc.iceConnectionState)) {
        const streams = { ...senderStreams };
        delete streams[id];
        setSenderStreams(streams);
      }
    }
  }, [senderStreams]);

  const localStreamRef = useCallback((node: HTMLVideoElement) => {
    if (node && !node.srcObject && localStream) {
      node.srcObject = localStream
    }
  }, [localStream]);

  useEffect(() => {
    async function go() {
      try {
        if (!keycloak.token) return;
        // Make a type for api
        await fetch(`https://${location.hostname}/api/ticket/`, {
          headers: {
            Authorization: keycloak.token
          }
        });
        socket.current = new WebSocket(`wss://${location.hostname}/sock/${localId}`);
      } catch (error) {
        // console.log({ goterror: error });
        setSnack({ snackOn: error as string, snackType: 'error' });
      }
    }
    void go();
  }, []);

  useEffect(() => {
    if (socket.current) {

      const sock = socket.current;

      if (!sock) return;

      sock.addEventListener('error', console.log);
      sock.addEventListener('open', heartbeat);
      sock.addEventListener('ping', heartbeat);
      sock.addEventListener('close', clearbeat);
      sock.addEventListener('message', messageHandler);

      return () => {
        sock.close();
        sock.removeEventListener('error', console.log);
        sock.removeEventListener('open', heartbeat);
        sock.removeEventListener('ping', heartbeat);
        sock.removeEventListener('close', clearbeat);
        sock.removeEventListener('message', messageHandler);
      }
    }
  }, [socket.current]);

  // Handle incoming peer streams
  useEffect(() => {
    async function go() {
      const senders = Object.keys(senderStreams).filter(sender => !senderStreams[sender].pc);
      const startedSenders: SenderStreams = {};

      // console.log(JSON.stringify(senders));

      await asyncForEach(senders, async (senderId) => {
        const startedSender = senderStreams[senderId];

        if (socket.current) {
          // startedSender.pc = await generatePeerConnection(sender, startedSender.peerResponse);

          // console.log('generating peer');
          startedSender.pc = new RTCPeerConnection(peerConnectionConfig)
          startedSender.pc.onicecandidate = event => gotIceCandidate(event, senderId);
          startedSender.pc.ontrack = event => gotRemoteStream(event, senderId, startedSender);
          startedSender.pc.oniceconnectionstatechange = () => checkPeerDisconnect(senderId, startedSender);
          if (localStream) {
            // console.log('sending local stream to peers');
            const tracks = localStream.getTracks();
            tracks.forEach(track => startedSender.pc?.addTrack(track));
          }

          if (startedSender.peerResponse && socket.current) {
            // console.log('received peer response');
            const description = await startedSender.pc.createOffer();
            await startedSender.pc.setLocalDescription(description);
            socket.current.send(JSON.stringify({
              sdp: startedSender.pc.localDescription,
              sender: localId,
              target: senderId,
              rtc: true
            }));
          } else {
            socket.current.send(JSON.stringify({
              sender: localId,
              target: senderId,
              type: 'peer-response',
              rtc: true
            }));
          }

          startedSenders[senderId] = startedSender;
        }
      });

      if (Object.keys(startedSenders).length) {
        // console.log('started peers', JSON.stringify(startedSenders, null, 2));
        setSenderStreams(Object.assign({}, senderStreams, startedSenders));
      }
    }
    void go();

  }, [socket.current, senderStreams]);

  // Handle incoming pending SDPs
  useEffect(() => {
    if (Object.keys(pendingSDPs).length) {

      async function go() {

        await asyncForEach(Object.keys(pendingSDPs), async sender => {
          const senderSDP = pendingSDPs[sender];
          const senderStream = senderStreams[sender];

          if (senderStream && senderStream.pc) {
            // console.log("going to assign", senderSDP, " to ", senderStream);

            await senderStream.pc.setRemoteDescription(new RTCSessionDescription(senderSDP));

            if ('offer' === senderSDP.type) {
              const description = await senderStream.pc.createAnswer();
              await senderStream.pc.setLocalDescription(description);
              socket.current && socket.current.send(JSON.stringify({
                sdp: senderStream.pc.localDescription,
                sender: localId,
                target: sender,
                rtc: true
              }));
            }
          }
        })
      }
      void go();

      setPendingSDPs({});
    }
  }, [socket.current, senderStreams, pendingSDPs]);

  // Handle incoming pending ICEs
  useEffect(() => {
    if (Object.keys(pendingICEs).length) {

      async function go() {

        await asyncForEach(Object.keys(pendingICEs), async sender => {
          const senderStream = senderStreams[sender];
          if (senderStream && senderStream.pc && !['failed', 'closed', 'disconnected'].includes(senderStream.pc.iceConnectionState)) {
            await senderStream.pc.addIceCandidate(new RTCIceCandidate(pendingICEs[sender]));
          }
        });
      }
      void go();

      setPendingSDPs({});
    }
  }, [socket.current, senderStreams, pendingICEs]);

  // Handle incoming text messages
  useEffect(() => {
    if (pendingMessages.length) {
      setMessages([...messages, ...pendingMessages]);
      setPendingMessages([]);
    }
  }, [pendingMessages, messages]);

  // Chat auto scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' })
  }, [messagesEndRef.current, messages]);

  const pendingQuotesContext = {
    canStartStop,
    messagesEndRef,
    chatLog: useMemo(() => messages.map((msg, i) => <Typography color="primary" style={{ overflowWrap: 'anywhere' }} key={i}>{msg}</Typography>), [messages]),
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

    submitMessage,

    submitMessageForm: useMemo(() => {
      return <form onSubmit={submitMessage}>
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
                submitMessage(e);
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

  return <>
    <ExchangeContext.Provider value={pendingQuotesContext}>
      {children}
    </ExchangeContext.Provider>
  </>;

}

export default ExchangeProvider;