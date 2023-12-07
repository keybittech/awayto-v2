/// <reference lib="WebWorker" />

import React, { Suspense, useContext, useEffect, useState, useMemo } from 'react';

import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
// import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import ListItem from '@mui/material/ListItem';
import Grid from '@mui/material/Unstable_Grid2';

import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import VideocamIcon from '@mui/icons-material/Videocam';
import CallIcon from '@mui/icons-material/Call';
import FileCopyIcon from '@mui/icons-material/FileCopy';

import { useComponents, useContexts, useStyles } from 'awayto/hooks';
import { IFile, OrderedFiles } from 'awayto/core';

export function Exchange(): React.JSX.Element {
  const classes = useStyles();

  const { ExchangeContext, WSTextContext, WSCallContext } = useContexts();

  if (!ExchangeContext || !WSTextContext || !WSCallContext) return <></>;

  const { Whiteboard, FileSelectionModal } = useComponents();
  const [dialog, setDialog] = useState('');
  const [chatOpen, setChatOpen] = useState(true);
  const [fileGroups, setFileGroups] = useState<OrderedFiles[]>([])
  const [sharedFile, setSharedFile] = useState<IFile | undefined>();

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
    setFileGroups(() => [
      { name: 'Exchange', order: 1, files: bookingFiles || [] }
    ]);
  }, [bookingFiles]);

  return <>

    <Dialog fullScreen fullWidth open={dialog === 'file_selection'}>
      <Suspense>
        <FileSelectionModal fileGroups={fileGroups} closeModal={(selectedFile?: IFile) => {
          if (selectedFile) {
            setSharedFile(selectedFile);
          }
          setDialog('');
        }} />
      </Suspense>
    </Dialog>


    <Grid p={1} sx={{ flex: '1 0 25%', display: 'flex', flexDirection: 'column', maxWidth: '390px' }}>
      <Grid sx={{ flex: 1, overflow: 'auto' }}>
        {chatLog}
        {messagesEnd}
      </Grid>

      <Grid pt={1}>
        {submitMessageForm}
      </Grid>
    </Grid>


    <Grid sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

      <Grid sx={{ maxHeight: '150px', backgroundColor: '#333' }}>
        {localStreamElement && localStreamElement}
        {senderStreamsElements && senderStreamsElements}
      </Grid>

      <Grid sx={{ height: localStreamElement || senderStreamsElements ? 'calc(100% - 150px)' : '100%', display: 'flex' }}>
        <Whiteboard
          topicId={`exchange/whiteboard:${exchangeId}`}
          sharedFile={sharedFile}
          openFileSelect={() => {
            setDialog('file_selection');
          }}
          optionsMenu={
            <List disablePadding
              subheader={
                <ListSubheader>Call</ListSubheader>
              }
            >
              <ListItem>
                <Box sx={classes.darkRounded} mr={1}>
                  {connected && <Button onClick={() => leaveCall()}>
                    Leave Call
                  </Button>}
                  {(!connected || audioOnly) && <Tooltip title="Start Video" children={
                    <IconButton disabled={'start' !== canStartStop} onClick={() => setLocalStreamAndBroadcast(true)}>
                      <VideocamIcon fontSize="small" />
                    </IconButton>
                  } />}
                  {!connected && <Tooltip title="Start Audio" children={
                    <IconButton disabled={'start' !== canStartStop} onClick={() => setLocalStreamAndBroadcast(false)}>
                      <CallIcon fontSize="small" />
                    </IconButton>
                  } />}
                </Box>
                <Tooltip title="Hide/Show Messages" children={
                  <IconButton color="primary" onClick={() => setChatOpen(!chatOpen)}>
                    <ChatBubbleIcon fontSize="small" />
                  </IconButton>
                } />
                <Tooltip title="Share File" children={
                  <IconButton color="primary" onClick={() => setDialog('file_selection')}>
                    <FileCopyIcon fontSize="small" />
                  </IconButton>
                } />
              </ListItem>
            </List>
          }
        />

      </Grid>
    </Grid>
  </>;
}

export default Exchange;
