/// <reference lib="WebWorker" />

import React, { useContext, useState } from 'react';

import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import useTheme from '@mui/material/styles/useTheme';

import ChatBubble from '@mui/icons-material/ChatBubble';
import Videocam from '@mui/icons-material/Videocam';
import Call from '@mui/icons-material/Call';

import { useComponents, useContexts } from 'awayto/hooks';

export function Exchange(): React.JSX.Element {

  const { ExchangeContext } = useContexts();
  const { Whiteboard } = useComponents();

  const {
    chatLog,
    messagesEnd,
    canStartStop,
    localStreamElement,
    senderStreamsElements,
    submitMessageForm,
    setLocalStreamAndBroadcast,
    leaveCall
  } = useContext(ExchangeContext) as ExchangeContextType;

  const theme = useTheme();

  const [chatOpen, setChatOpen] = useState(true);

  return <>
    <Card sx={{ height: '100%', backgroundColor: theme.palette.primary.dark }}>
      <CardActions>
        <Button onClick={() => setChatOpen(!chatOpen)} type="submit" color="primary"><ChatBubble /> Toggle Chat</Button>
        {
          !localStreamElement ? (<>
            <form onSubmit={e => {
              e.preventDefault();
              setLocalStreamAndBroadcast(true);
            }}>
              <Button disabled={'start' !== canStartStop} type="submit" color="primary"><Videocam color="primary" /> Start Video</Button>
            </form>

            <form onSubmit={e => {
              e.preventDefault();
              setLocalStreamAndBroadcast(false);
            }}>
              <Button disabled={'start' !== canStartStop} type="submit" color="primary"><Call color="primary" /> Start Voice</Button>
            </form>
          </>
          ) : <form onSubmit={leaveCall}>
            <Button type="submit" color="primary">Leave Call</Button>
          </form>
        }
      </CardActions>
      <CardContent sx={{ height: 'calc(100% - 60px)' }}> {/* height minus action bar height estimate */}

        <Grid container spacing={1} style={{ height: '100%', position: 'relative' }} direction="row">

          <Grid item xs={8} md={4} hidden={!chatOpen} style={{ height: '100%' }}>
            <Grid container direction="column" style={{ height: !!localStreamElement ? '50%' : 'unset', display: 'flex', flexWrap: 'nowrap' }}>
              {/* ---------- Video ---------- */}
              {localStreamElement && <Grid item xs={12} style={{ backgroundColor: 'black', position: 'relative', maxHeight: '390px', display: 'flex', flex: '1' }}>
                <Grid container justifyContent="flex-end" style={{ position: 'absolute' }}>
                  {localStreamElement}
                </Grid>
                {!!Object.keys(senderStreamsElements).length && senderStreamsElements}
              </Grid>}
            </Grid>
            
            {/* ---------- Chat ---------- */}
            <Grid container direction="column" style={{ height: !!localStreamElement ? '50%' : '100%' }}>
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
            <Whiteboard />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  </>;
}

export default Exchange;
