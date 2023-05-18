/// <reference lib="WebWorker" />

import React, { useContext, useState } from 'react';

import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import useTheme from '@mui/material/styles/useTheme';

import ChatBubble from '@mui/icons-material/ChatBubble';
import Videocam from '@mui/icons-material/Videocam';
import Call from '@mui/icons-material/Call';
import FileCopy from '@mui/icons-material/FileCopy';

import { useComponents, useContexts, useStyles } from 'awayto/hooks';

export function Exchange(): React.JSX.Element {
  const classes = useStyles();

  const { ExchangeContext, WSTextContext, WSCallContext } = useContexts();
  const { Whiteboard } = useComponents();

  const {
    exchangeId,
  } = useContext(ExchangeContext) as ExchangeContextType;

  const {
    chatLog,
    messagesEnd,
    submitMessageForm,
  } = useContext(WSTextContext) as WSTextContextType;

  const {
    audioOnly,
    connected,
    canStartStop,
    localStreamElement,
    senderStreamsElements,
    setLocalStreamAndBroadcast,
    leaveCall
  } = useContext(WSCallContext) as WSCallContextType;

  const theme = useTheme();

  const [chatOpen, setChatOpen] = useState(true);

  return <>
    <Card sx={{ height: '100%', backgroundColor: theme.palette.primary.dark }}>
      <CardActions>
        <Box className={classes.darkRounded} mr={1}>
          {connected && <Button sx={{ color: 'white' }} onClick={() => leaveCall()}>
            Leave Call
          </Button>}
          {(!connected || audioOnly) && <Tooltip title="Start Video" children={
            <IconButton disabled={'start' !== canStartStop} onClick={() => setLocalStreamAndBroadcast(true)}>
              <Videocam sx={{ color: 'white' }} />
            </IconButton>
          } />}
          {!connected && <Tooltip title="Start Audio" children={
            <IconButton disabled={'start' !== canStartStop} onClick={() => setLocalStreamAndBroadcast(false)}>
              <Call sx={{ color: 'white' }} />
            </IconButton>
          } />}
        </Box>
        <Tooltip title="Hide/Show Messages" children={
          <IconButton size="small" onClick={() => setChatOpen(!chatOpen)} sx={{ color: 'beige', backgroundColor: 'burlywood' }}>
            <ChatBubble />
          </IconButton>
        } />
        <Button onClick={() => setChatOpen(!chatOpen)}>
          <FileCopy /> Load File
        </Button>
      </CardActions>
      <CardContent sx={{ height: 'calc(100% - 60px)' }}> {/* height minus action bar height estimate */}

        <Grid container spacing={1} style={{ height: '100%', position: 'relative' }} direction="row">

          <Grid item xs={8} md={4} sx={{ display: chatOpen ? 'flex' : 'none', height: '100%' }}>
            <Grid container direction="column" style={{ flex: 1, flexWrap: 'nowrap' }}>
              {/* ---------- Video ---------- */}
              {localStreamElement && <Grid item xs={12} style={{ backgroundColor: 'black', position: 'relative', maxHeight: '390px', display: 'flex', flex: '1' }}>
                <Grid container justifyContent="flex-end" style={{ position: 'absolute' }}>
                  {localStreamElement}
                </Grid>
                {!!Object.keys(senderStreamsElements).length && senderStreamsElements}
              </Grid>}
            </Grid>

            {/* ---------- Chat ---------- */}
            <Grid container direction="column">
              <Grid item pr={1} style={{ flex: '1', overflow: 'auto' }}>
                {chatLog}
                {messagesEnd}
              </Grid>

              <Grid item pt={1}>
                {submitMessageForm}
              </Grid>
            </Grid>
          </Grid>

          <Grid item xs={12} md={chatOpen ? 8 : 12} sx={{ height: '100%' }}>
            <Whiteboard topicId={`exchange/whiteboard:${exchangeId}`} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  </>;
}

export default Exchange;
