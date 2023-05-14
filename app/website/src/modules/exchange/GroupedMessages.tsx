import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ExchangeMessage, utcDTLocal } from 'awayto/core';


interface IProps {
  exchangeMessages?: ExchangeMessage[];
}

interface GroupedMessage {
  sender: string;
  timestamp: string;
  messages: string[];
}

function GroupedMessages({ exchangeMessages: messages }: IProps): React.JSX.Element {
  if (!messages) return <></>;

  // Prepare the data structure
  const groupedMessages: GroupedMessage[] = [];
  let currentGroup: GroupedMessage | null = null;
  
  console.log({ messages })

  messages.forEach((msg, i) => {
    if (i === 0 || messages[i - 1].sender !== msg.sender) {
      currentGroup = { sender: msg.sender, messages: [msg.message], timestamp: msg.timestamp };
      groupedMessages.push(currentGroup);
    } else if (currentGroup) {
      currentGroup.messages.push(msg.message);
    }
  });

  // Render
  return (
    <>
      {groupedMessages.map((group, i) => (
        <Box key={`${group.sender}_group_${i}`}>
          <Typography variant="subtitle1"><strong>{group.sender}</strong></Typography>
          <Typography variant="body2">{utcDTLocal(group.timestamp)}</Typography>
          {group.messages.map((message, j) => (
            <Typography color="primary" style={{ overflowWrap: 'anywhere' }} key={`${group.sender}_msg_${j}`}>
              {message}
            </Typography>
          ))}
        </Box>
      ))}
    </>
  );
}

export default GroupedMessages;
