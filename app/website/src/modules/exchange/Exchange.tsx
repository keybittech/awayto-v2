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

export function Exchange(): JSX.Element {

  const { ExchangeContext } = useContexts();
  const { Whiteboard } = useComponents();

  const {
    chatLog,
    messagesEndRef,
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
    <Card sx={{ height: '100%' }}>
      <CardActions>
        <Button onClick={() => setChatOpen(!chatOpen)} type="submit" color="primary"><ChatBubble /></Button>
        {
          !localStreamElement ? (<>
            <form onSubmit={e => {
              e.preventDefault();
              setLocalStreamAndBroadcast(true);
            }}>
              <Button disabled={'start' !== canStartStop} type="submit" color="primary"><Videocam color="primary" /></Button>
            </form>

            <form onSubmit={e => {
              e.preventDefault();
              setLocalStreamAndBroadcast(false);
            }}>
              <Button disabled={'start' !== canStartStop} type="submit" color="primary"><Call color="primary" /></Button>
            </form>
          </>
          ) : <form onSubmit={leaveCall}>
            <Button type="submit" color="primary">Leave Call</Button>
          </form>
        }
      </CardActions>
      <CardContent sx={{ height: 'calc(100% - 60px)' }}> {/* height minus action bar height estimate */}

        <Grid container style={{ height: '100%' }} direction="row" justifyContent="space-evenly">
          <Grid item xs={12} md={5} style={{ height: '100%', backgroundColor: theme.palette.primary.dark }}>
            <Whiteboard />
          </Grid>
          <Grid item xs={12} md={5}>
            <Grid container direction="column" style={{ height: '100%', display: 'flex', flexWrap: 'nowrap' }}>
              {/* ---------- Video ---------- */}
              {localStreamElement && <Grid item xs={12} style={{ backgroundColor: 'black', position: 'relative', maxHeight: '390px', display: 'flex', flex: '1' }}>
                <Grid container justifyContent="flex-end" style={{ position: 'absolute' }}>
                  {localStreamElement}
                </Grid>
                {!!Object.keys(senderStreamsElements).length && senderStreamsElements}
              </Grid>}

              {/* ---------- Chat ---------- */}
              <Grid item xs={12} hidden={!chatOpen} style={{ height: '100%', flex: '1' }}>
                <Grid container direction="column" style={{ height: '100%' }}>
                  <Grid item style={{ flex: '1', overflow: 'auto', color: theme.palette.primary.contrastText, backgroundColor: theme.palette.primary.dark, padding: '0 25px' }}>
                    <Grid container direction="column">
                      {chatLog}
                    </Grid>
                    <Grid item ref={messagesEndRef} />
                  </Grid>

                  <Grid item style={{ backgroundColor: theme.palette.primary.dark, padding: '25px' }}>
                    {submitMessageForm}
                  </Grid>
                </Grid>
              </Grid>

            </Grid>
          </Grid>
        </Grid>

      </CardContent>
    </Card>
  </>;
}

export default Exchange;
