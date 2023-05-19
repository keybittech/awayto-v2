/// <reference lib="WebWorker" />

import React, { Suspense, useContext, useEffect, useState } from 'react';

import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
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
import { IFile, OrderedFiles } from 'awayto/core';

export function Exchange(): React.JSX.Element {
  const classes = useStyles();

  const { ExchangeContext, WSTextContext, WSCallContext } = useContexts();
  const { Whiteboard, FileSelectionModal } = useComponents();
  const [dialog, setDialog] = useState('');
  const [chatOpen, setChatOpen] = useState(true);
  const [fileGroups, setFileGroups] = useState<OrderedFiles[]>([])
  const [sharedFile, setSharedFile] = useState<IFile | undefined>();

  const theme = useTheme();

  const {
    exchangeId,
    getBookingFiles: {
      data: bookingFiles
    }
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

  useEffect(() => {
    setFileGroups(f => [
      { name: 'Exchange', order: 1, files: bookingFiles || [] }
    ]);
  }, [bookingFiles]);

  return <>

    <Dialog fullScreen open={dialog === 'file_selection'} fullWidth maxWidth="sm">
      <Suspense>
        <FileSelectionModal fileGroups={fileGroups} closeModal={(selectedFile?: IFile) => {
          if (selectedFile) {
            setSharedFile(selectedFile);
          }
          setDialog('');
        }} />
      </Suspense>
    </Dialog>

    <Card sx={{ height: '100%', backgroundColor: theme.palette.primary.dark }}>
      <CardActions>
        <Box className={classes.darkRounded} mt={1} mx={2}>
          {connected && <Button onClick={() => leaveCall()}>
            Leave Call
          </Button>}
          {(!connected || audioOnly) && <Tooltip title="Start Video" children={
            <IconButton disabled={'start' !== canStartStop} onClick={() => setLocalStreamAndBroadcast(true)}>
              <Videocam fontSize="small" />
            </IconButton>
          } />}
          {!connected && <Tooltip title="Start Audio" children={
            <IconButton disabled={'start' !== canStartStop} onClick={() => setLocalStreamAndBroadcast(false)}>
              <Call fontSize="small" />
            </IconButton>
          } />}
        </Box>
        <Tooltip title="Hide/Show Messages" children={
          <IconButton color="primary" onClick={() => setChatOpen(!chatOpen)}>
            <ChatBubble fontSize="small" />
          </IconButton>
        } />
        <Tooltip title="Share File" children={
          <IconButton color="primary" onClick={() => setDialog('file_selection')}>
            <FileCopy fontSize="small" />
          </IconButton>
        } />

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
            <Whiteboard sharedFile={sharedFile} topicId={`exchange/whiteboard:${exchangeId}`} />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  </>;
}

export default Exchange;
