/// <reference lib="WebWorker" />

import React, { Suspense, useContext, useEffect, useState } from 'react';

import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import ListItem from '@mui/material/ListItem';
import useTheme from '@mui/material/styles/useTheme';

import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import VideocamIcon from '@mui/icons-material/Videocam';
import CallIcon from '@mui/icons-material/Call';
import FileCopyIcon from '@mui/icons-material/FileCopy';

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

    <Stack sx={{ height: '100%' }} direction="row">
      <Box sx={{
        backgroundColor: theme.palette.primary.dark,
        padding: 1,
        display: chatOpen ? 'flex' : 'none',
        height: '100%', width: chatOpen ? '30%' : '100%'
      }}>
        <Grid container direction="column" sx={{ flex: 1, flexWrap: 'nowrap' }}>
          {/* ---------- Video ---------- */}
          {localStreamElement && <Grid item xs={12} sx={{ backgroundColor: 'black', position: 'relative', maxHeight: '390px', display: 'flex', flex: '1' }}>
            <Grid container justifyContent="flex-end" sx={{ position: 'absolute' }}>
              {localStreamElement}
            </Grid>
            {!!Object.keys(senderStreamsElements).length && senderStreamsElements}
          </Grid>}
        </Grid>

        {/* ---------- Chat ---------- */}
        <Grid container direction="column">
          <Grid item pr={1} sx={{ flex: '1', overflow: 'auto' }}>
            {chatLog}
            {messagesEnd}
          </Grid>

          <Grid item pt={1}>
            {submitMessageForm}
          </Grid>
        </Grid>
      </Box>

      <Box sx={{ height: '100%', width: chatOpen ? '70%' : '100%' }}>
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
                <Box className={classes.darkRounded} mr={1}>
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
      </Box>
    </Stack>
  </>;
}

export default Exchange;
