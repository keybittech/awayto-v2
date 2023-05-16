import React from 'react';

import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver';
import TextFieldsIcon from '@mui/icons-material/TextFields';

import { ExchangeMessage, utcDTLocal } from 'awayto/core';
import capitalize from '@mui/material/utils/capitalize';

interface IProps {
  exchangeMessages?: ExchangeMessage[];
}

interface GroupedMessage extends Omit<ExchangeMessage, 'message'> {
  messages: string[];
}

function GroupedMessages({ exchangeMessages: messages }: IProps): React.JSX.Element {
  if (!messages) return <></>;

  const groupedMessages: GroupedMessage[] = [];
  let currentGroup: GroupedMessage | null = null;
  messages.forEach((msg, i) => {
    if (i === 0 || messages[i - 1].sender !== msg.sender || messages[i -1].style !== msg.style) {
      currentGroup = {
        sender: msg.sender,
        style: msg.style,
        messages: [msg.message],
        timestamp: msg.timestamp
      };
      groupedMessages.push(currentGroup);
    } else if (currentGroup) {
      currentGroup.messages.push(msg.message);
    }
  });
  

  return <>
    <Card sx={{ marginBottom: '8px' }}>
      <CardContent>
        <Typography variant="body2">Messages will appear here...</Typography>
      </CardContent>
    </Card>
    {groupedMessages.map((group, i) => (
      <Card sx={{ marginBottom: '8px' }} key={`${group.sender}_group_${i}`}>
        <CardContent>
          <Grid container>
            <Grid item sx={{ flex: 1 }}>
              <strong>{group.sender}</strong>
            </Grid>
            <Grid item>
              <Tooltip title={capitalize(group.style)}>
                <IconButton disableRipple>
                  {'utterance' == group.style && <RecordVoiceOverIcon  />}
                  {'written' == group.style && <TextFieldsIcon />}
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
          <Typography variant="body2">{utcDTLocal(group.timestamp || '')}</Typography>
          {group.messages.map((message, j) => (
            <Typography color="primary" style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }} key={`${group.sender}_msg_${j}`}>
              {message}
            </Typography>
          ))}
        </CardContent>
      </Card>
    ))}
  </>
}

export default GroupedMessages;
