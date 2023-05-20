import { useMemo, useState } from 'react';

import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';

import Send from '@mui/icons-material/Send';

declare global {
  interface IProps {
    sendTextMessage?: (msg: string) => void;
  }
}

export function SubmitMessageForm({ sendTextMessage }: IProps): React.JSX.Element {
  
  const [textMessage, setTextMessage] = useState('');

  return useMemo(() => {
    return <form onSubmit={e => {
      e.preventDefault();
      sendTextMessage && sendTextMessage(textMessage);
      setTextMessage('');
    }}>
      <TextField
        fullWidth
        multiline
        id="message"
        label="Type here then press enter..."
        value={textMessage}
        name="message"
        onChange={e => setTextMessage(e.target.value)}
        InputProps={{
          onKeyDown: e => {
            if ('Enter' === e.key && !e.shiftKey) {
              e.preventDefault();
              sendTextMessage && sendTextMessage(textMessage);
              setTextMessage('');
            }
          },
          endAdornment: (
            <InputAdornment position="end">
              <IconButton type="submit" aria-label="toggle password visibility">
                <Send />
              </IconButton>
            </InputAdornment>
          )
        }}
      />
    </form>
  }, [textMessage])
}

export default SubmitMessageForm;