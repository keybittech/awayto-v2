/// <reference lib="WebWorker" />

import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, CardActionArea, Grid, TextField, Typography, CardActions, CardHeader, InputAdornment, IconButton, Box } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Collapse from '@material-ui/core/Collapse';
import { asyncForEach, IUtilActionTypes } from 'awayto';
import { useAct, useComponents } from 'awayto-hooks';

import Videocam from '@material-ui/icons/Videocam';
import Call from '@material-ui/icons/Call';


import keycloak from '../../../keycloak';
import { ChatBubble, Send } from '@material-ui/icons';

const peerConnectionConfig = {
  'iceServers': [
    { urls: `turn:${location.hostname}:3478`, credential: 'test123', username: 'test' },
    { urls: `stun:${location.hostname}:3478` },
  ]
};

type TextMessage = {
  sender: string;
  created: string;
  message: string;
}

type SocketResponseMessageAttributes = {
  sdp: RTCSessionDescriptionInit;
  ice: RTCIceCandidateInit;
  formats: string[];
} & {
  [prop: string]: string;
}

type Sender = {
  pc?: RTCPeerConnection;
  mediaStream?: MediaStream;
  peerResponse: boolean;
}

type SenderStreams = {
  [prop: string]: Sender
}

const { SET_SNACK } = IUtilActionTypes;

function heartbeat(this: { [prop: string]: ReturnType<typeof setTimeout> }) {
  // console.log('pinged');
  clearTimeout(this.pingTimeout);
  this.pingTimeout = setTimeout(function () {
    // console.log('server didn\'t ping');
  }, 30000 + 1000);
}

function clearbeat(this: WebSocket & { [prop: string]: ReturnType<typeof setTimeout> }) {
  // console.log('closed connection.');
  clearTimeout(this.pingTimeout);
}

export function Home(props: IProps): JSX.Element {
  const { classes, ...restProps } = props;
  const act = useAct();
  const { Video } = useComponents();
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [localId, setLocalId] = useState('');
  const socket = useRef<WebSocket>();
  const [textMessage, setTextMessage] = useState('');
  const [messages, setMessages] = useState([] as string[]);
  const [senderStreams, setSenderStreams] = useState({} as SenderStreams);
  const [canStartStop, setCanStartStop] = useState('start');
  const [chatOpen, setChatOpen] = useState(true);
  const [pendingSDPs, setPendingSDPs] = useState({} as { [prop: string]: RTCSessionDescriptionInit });
  const [pendingICEs, setPendingICEs] = useState({} as { [prop: string]: RTCIceCandidateInit });
  const messagesEndRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    async function go() {
      try {
        const id = `test-${(new Date).getTime()}`;

        // Make a type for api
        await fetch(`https://${location.hostname}/api/ticket/`, {
          headers: {
            Authorization: keycloak.token!
          }
        });
        socket.current = new WebSocket(`wss://${location.hostname}/sock/${id}`);
        setLocalId(id);
      } catch (error) {
        // console.log({ goterror: error });
        act(SET_SNACK, { snackOn: error as string, snackType: 'error' });
      }
    }
    void go();
  }, []);

  const setLocalStreamAndBroadcast = useCallback(async (video: boolean): Promise<void> => {
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
            width: { max: 320 },
            height: { max: 240 },
            frameRate: { max: 30 }
          };
        }

        setLocalStream(await navigator.mediaDevices.getUserMedia(callOptions));
        socket.current.send(JSON.stringify({
          sender: localId,
          type: 'join-call',
          formats: Object.keys(callOptions),
          rtc: true
        }));
        setCanStartStop('stop');
      }
    } catch (error) {
      act(SET_SNACK, { snackOn: (error as DOMException).message, snackType: 'error' });
    }
  }, [socket.current, localStream, canStartStop, localId]);

  useEffect(() => {
    async function go() {
      console.log('setting up peer connection');
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
          startedSender.pc.oniceconnectionstatechange = event => checkPeerDisconnect(senderId, startedSender);
          if (localStream) {
            // console.log('sending local stream to peers');
            const tracks = localStream.getTracks();
            tracks.forEach(track => startedSender.pc!.addTrack(track));
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

  const messageHandler = useCallback(async (sockMsg: MessageEvent<{ text(): Promise<string> }>): Promise<void> => {
    // console.log('setting handler')
    if (!socket.current) return;
    const { sender, type, formats, target, sdp, ice, message, rtc, status } = JSON.parse(await sockMsg.data.text()) as SocketResponseMessageAttributes;

    if (sender === localId || (target !== localId && !(rtc || sdp || ice))) {
      return;
    }

    if ('text' === type) {
      setMessages([...messages, message]);
    } else if (['join-call', 'peer-response'].includes(type)) {
      // Parties to an incoming caller's 'join-call' will see this, and then notify the caller that they exist in return
      // The caller gets a party member's 'peer-response', and sets them up in return
      if (!localStream && formats) {
        setMessages([...messages, `${sender} wants to start a ${formats.indexOf('video') > -1 ? 'video' : 'voice'} call.`]);
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
  }, [socket.current, messages, senderStreams]);

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
  }, [socket.current, senderStreams, pendingICEs])

  useEffect(() => {
    if (socket.current) {

      const sock = socket.current;

      if (!sock) return;

      sock.addEventListener('error', console.log);
      sock.addEventListener('open', heartbeat);
      sock.addEventListener('ping', heartbeat);
      sock.addEventListener('close', clearbeat);
      sock.addEventListener('message', e => void messageHandler(e));

      return () => {
        sock.close();
        sock.removeEventListener('error', console.log);
        sock.removeEventListener('open', heartbeat);
        sock.removeEventListener('ping', heartbeat);
        sock.removeEventListener('close', clearbeat);
        sock.removeEventListener('message', e => void messageHandler(e));
      }
    }
  }, [localId]);

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

  const submitMessage = useCallback((e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (!socket.current || !textMessage) return;
    try {
      socket.current.send(JSON.stringify({
        sender: localId,
        type: 'text',
        message: textMessage
      }));
      setTextMessage('');
      setMessages([...messages, textMessage]);
    } catch (error) {
      act(SET_SNACK, { snackOn: error as string });
    }
  }, [socket.current, textMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' })
  }, [messagesEndRef.current, messages]);

  const videoCall = useCallback((e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void setLocalStreamAndBroadcast(true);
  }, [setLocalStreamAndBroadcast]);

  const audioCall = useCallback((e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void setLocalStreamAndBroadcast(false);
  }, [setLocalStreamAndBroadcast])

  const stopSharing = useCallback((e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
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
    }
  }, [senderStreams, localStream, canStartStop, setLocalStream]);

  const localStreamRef = useCallback((node: HTMLVideoElement) => {
    if (node && !node.srcObject && localStream) {
      node.srcObject = localStream
    }
  }, [localStream]);

  const messagesMemo = useMemo(() => messages.map((msg, i) => <Typography key={i} variant='body1'>{msg}</Typography>), [messages]);
  const senderStreamsElements = useMemo(() => Object.keys(senderStreams).map(sender => {
    if (senderStreams[sender].mediaStream) {
      console.log('building element', JSON.stringify(senderStreams[sender], null, 2));
      return <Video {...props} key={sender} autoPlay srcObject={senderStreams[sender].mediaStream} />
    }
  }), [senderStreams]);
  const localStreamElement = useMemo(() => !localStream ? <></> : <video key={'local-video'} autoPlay controls ref={localStreamRef} />, [localStream, localStreamRef]);

  return !socket.current ? <></> : <Card>
    <CardActions>
      <Button onClick={() => setChatOpen(!chatOpen)} type="submit" color="primary"><ChatBubble /></Button>
      {
        !localStream ? (<>
          <form onSubmit={videoCall}>
            <Button disabled={'start' !== canStartStop} type="submit" color="primary"><Videocam color="primary" /></Button>
          </form>

          <form onSubmit={audioCall}>
            <Button disabled={'start' !== canStartStop} type="submit" color="primary"><Call color="primary" /></Button>
          </form>
        </>
        ) : <form onSubmit={stopSharing}>
          <Button type="submit" color="primary">Leave Call</Button>
        </form>
      }
    </CardActions>
    <CardContent>

      <Grid container direction="row">
        <Grid item xs={6} style={{ minHeight: '250px', backgroundColor: 'whitesmoke', color: '#333' }}>document placeholder</Grid>
        <Grid item xs={6}>
          <Grid container direction="column">
            <Grid item>
              {localStreamElement}
            </Grid>
            <Grid item>
              {senderStreamsElements}
            </Grid>
            <Grid item hidden={!chatOpen}>

              <Grid container direction="column" justifyContent="flex-start" alignItems="stretch" spacing={4}>

                <Grid item style={{ overflow: 'auto', height: '25vh' }}>

                  <Grid container>
                    <Grid item style={{ flexGrow: 1 }}>
                      <Grid container direction="column" justifyContent='flex-end'>

                        {messagesMemo.map((m, i) => <Grid key={`message_${i}`} item>{m}</Grid>)}
                      </Grid>

                      <Grid item ref={messagesEndRef} />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item>
                  <form onSubmit={submitMessage}>

                    <TextField
                      fullWidth
                      id="message"
                      label="Message"
                      value={textMessage}
                      name="message"
                      onChange={e => setTextMessage(e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">

                            <IconButton
                              type="submit"
                              aria-label="toggle password visibility"
                            >
                              <Send />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </form>
                </Grid>

              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

    </CardContent>
  </Card>;
}

export default Home;
