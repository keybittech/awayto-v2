import React, { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Grid, TextField, Typography } from '@material-ui/core';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import keycloak from '../../../keycloak';
import { IUtilActionTypes } from 'awayto';
import { useAct, useComponents } from 'awayto-hooks';
import { inspect } from 'util';
import { go } from 'connected-react-router';

const peerConnectionConfig = {
  'iceServers': [
    { urls: 'turn:192.168.1.54:3478', credential: 'test123', username: 'test' },
    { urls: 'stun:192.168.1.54:3478' },
  ]
};

type SocketResponseMessageAttributes = {
  sdp: RTCSessionDescriptionInit;
  ice: RTCIceCandidateInit;
} & {
  [prop: string]: string;
}

type SenderStreams = {
  [prop: string]: {
    pc: RTCPeerConnection;
    mediaStream?: MediaStream;
  }
}

const { SET_SNACK } = IUtilActionTypes;

export function Home(props: IProps): JSX.Element {
  const { classes } = props;
  const act = useAct();
  const { Video } = useComponents();
  const [localStream, setLocalStream] = useState<MediaStream>();
  const [localId, setLocalId] = useState('');
  const [socket, setSocket] = useState(null as unknown as WebSocket);
  const [textMessage, setTextMessage] = useState('');
  const [messages, setMessages] = useState([] as string[]);
  const [senderStreams, setSenderStreams] = useState({} as SenderStreams);
  const [participantCheck, setParticipantCheck] = useState(false);



  useEffect(() => {
    async function go() {
      setLocalId(`test-${(new Date).getTime()}`);
      // Make a type for api
      await fetch(`https://${location.hostname}/api/ticket/`, {
        method: 'POST',
        headers: {
          Authorization: keycloak.token!
        }
      });

      setSocket(new WebSocket(`wss://${location.hostname}/sock/${localId}`));
    }
    void go();
  }, []);

  const setLocalStreamAndBroadcast = useCallback(async () => {
    try {
      if (socket && !localStream) {
        debugger
        setLocalStream(await navigator.mediaDevices.getUserMedia({
          video: {
            width: { max: 320 },
            height: { max: 240 },
            frameRate: { max: 30 }
          },
          audio: {
            autoGainControl: true
          }
        }));
        socket.send(JSON.stringify({
          sender: localId,
          type: 'join-call',
          rtc: true
        }));
      }
    } catch (error) {
      act(SET_SNACK, { snackOn: (error as DOMException).message, snackType: 'error' });
    }
  }, [socket, localStream]);

  // useEffect(() => {
  //   if (socket && localStream) {
      
  //   }
  // }, [localStream])

  const messageHandler = useCallback(function (sockMsg: MessageEvent<{ [prop: string]: unknown }> & { data: { text: () => Promise<string> } }) {
    
    console.log('got message')
    async function go() {
      const { sender, type, target, sdp, ice, message, rtc, status } = JSON.parse(await sockMsg.data.text()) as SocketResponseMessageAttributes;
      console.log('got data', { sender, type, target, message })
      // if (sender === localId || (target !== localId && !(rtc || sdp || ice))) return;

      if ('text' === type) {
        setMessages([...messages, message]);
      } else if ('join-call' === type) {
        // if (!localStream) {
        //   await setLocalStreamAndBroadcast();
        // }

        // if (!localStream) return;

        // Parties to an incoming caller will see this, and then notify the caller that they exist in return
        await generatePeerConnection(sender);
        socket.send(JSON.stringify({
          sender: localId,
          target: sender,
          type: 'peer-response',
          rtc: true
        }));
      } else if ('peer-response' === type) {
        // The caller gets a party member's response, and sets them up in return
        await generatePeerConnection(sender, true);
      } else if (sdp) {
        await senderStreams[sender].pc.setRemoteDescription(new RTCSessionDescription(sdp));
        if ('offer' === sdp.type) {
          const description = await senderStreams[sender].pc.createAnswer();
          await createdDescription(description, sender);
        }
      } else if (ice) {
        await senderStreams[sender].pc.addIceCandidate(new RTCIceCandidate(ice));
      }
    }
    void go();

  }, [socket, messages, localStream, senderStreams, setMessages, generatePeerConnection, createdDescription, setLocalStreamAndBroadcast]);

  useEffect(() => {
    if (socket) {

      window.addEventListener('unload', function () {
        if (socket.readyState === WebSocket.OPEN) socket.close();
      });

      function hb(this: { [prop: string]: ReturnType<typeof setTimeout> }) {
        console.log('pinged');
        clearTimeout(this.pingTimeout);
        this.pingTimeout = setTimeout(function () {
          console.log('server didn\'t ping');
        }, 30000 + 1000);
      }

      socket.addEventListener('error', console.log);
      socket.addEventListener('open', hb);
      socket.addEventListener('ping', hb);
      socket.addEventListener('close', function (this: WebSocket & { [prop: string]: ReturnType<typeof setTimeout> }) {
        console.log('closed connection.');
        clearTimeout(this.pingTimeout);
      });
      socket.addEventListener('message', messageHandler);
    }
  }, [socket, messageHandler]);

  const submitMessage = useCallback((e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    try {
      socket.send(JSON.stringify({
        sender: localId,
        type: 'text',
        message: textMessage
      }));
      setTextMessage('');
    } catch (error) {
      act(SET_SNACK, { snackOn: error as string });
    }

  }, [socket, textMessage]);

  async function generatePeerConnection(sender: string, initCall = false) {
    const rtcPeer = new RTCPeerConnection(peerConnectionConfig)
    rtcPeer.onicecandidate = event => gotIceCandidate(event, sender);
    rtcPeer.ontrack = event => gotRemoteStream(event, sender);
    rtcPeer.oniceconnectionstatechange = event => checkPeerDisconnect(event, sender);
    if (localStream) {
      const tracks = localStream.getTracks();
      tracks.forEach(track => rtcPeer.addTrack(track));
    }

    senderStreams[sender] = {
      pc: rtcPeer
    };

    if (initCall) {
      const description = await senderStreams[sender].pc.createOffer();
      await createdDescription(description, sender);
    }
  }

  async function createdDescription(description: RTCLocalSessionDescriptionInit, sender: string) {
    await senderStreams[sender].pc.setLocalDescription(description)
    socket.send(JSON.stringify({
      sdp: senderStreams[sender].pc.localDescription,
      sender: localId,
      target: sender,
      rtc: true
    }));
  }

  function gotIceCandidate(event: RTCPeerConnectionIceEvent, sender: string) {
    if (event.candidate !== null) {
      socket.send(JSON.stringify({
        ice: event.candidate,
        sender: localId,
        target: sender,
        rtc: true
      }));
    }
  }

  function gotRemoteStream(event: RTCTrackEvent, sender: string) {
    senderStreams[sender].mediaStream = new MediaStream();
    senderStreams[sender].mediaStream!.addTrack(event.track);
    setParticipantCheck(!participantCheck);
  }

  function checkPeerDisconnect(event: Event, sender: string) {
    const state = senderStreams[sender].pc.iceConnectionState;
    if (['failed', 'closed', 'disconnected'].includes(state)) {
      delete senderStreams[sender];
      setParticipantCheck(!participantCheck);
    }
  }

  const startSharing = useCallback((e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    void setLocalStreamAndBroadcast();
  }, [setLocalStreamAndBroadcast]);  

  function stopSharing() {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(undefined);
      Object.keys(senderStreams).forEach(function (sender) {
        senderStreams[sender].pc.close();
        senderStreams[sender].mediaStream = undefined;
        setParticipantCheck(!participantCheck);
      });
    }
  }

  const localStreamRef = useCallback((node: HTMLVideoElement) => {
    if (node && !node.srcObject && localStream) {
      node.srcObject = localStream
    }
  }, [localStream]);

  const messagesMemo = useMemo(() => messages.map((msg, i) => <Typography key={i} variant='body1'>{msg}</Typography>), [messages]);
  const senderStreamsElements = useMemo(() => Object.keys(senderStreams).map(sender => senderStreams[sender].mediaStream ? <video autoPlay ref={v => { v!.srcObject = senderStreams[sender].mediaStream! }} /> : <></>), [participantCheck]);
  const localStreamElement = useMemo(() => <video key={'local-video'} autoPlay ref={localStreamRef} />, [localStreamRef]);


  return !socket ? <></> : <>
    <Card>
      <CardContent>
        <form onSubmit={submitMessage}>

          <Grid container direction="column" justifyContent="flex-start" alignItems="stretch" spacing={4}>

            <Grid item>
              <TextField
                fullWidth
                id="message"
                label="Message"
                value={textMessage}
                name="message"
                onChange={e => setTextMessage(e.target.value)}
              />
            </Grid>


            <Grid item>
              <Grid container justifyContent="space-between">
                <Button type="submit" color="primary">Send Message</Button>
              </Grid>
            </Grid>
          </Grid>
        </form>

        <form onSubmit={startSharing}>
          <Button type="submit" color="primary">Share Audio/Video</Button>
        </form>

        <Grid container direction="column" justifyContent="flex-start" alignItems="stretch" spacing={4}>

          <Grid item>
            {messagesMemo}
          </Grid>
        </Grid>


        <Grid container direction="column" justifyContent="flex-start" alignItems="stretch" spacing={4}>

          <Grid item>
            {localStreamElement}
            {senderStreamsElements}
          </Grid>
        </Grid>
        <Typography variant="h5">Yo!!!sdfkvsjhsdkfjghkj.</Typography>
        <Typography variant="body1">This is a sandbox. Begin building your application by developing new modules. Check out the <Typography className={classes.link} color="secondary" component={Link} to={{ pathname: "https://awayto.dev/start" }} target="_blank">Getting Started</Typography> and <Typography className={classes.link} color="secondary" component={Link} to={{ pathname: "https://awayto.dev/faq" }} target="_blank">FAQ</Typography> guides to begin.</Typography>
      </CardContent>
    </Card>
  </>;
}

export default Home;
