import React, { useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';

import { sh } from 'awayto/hooks';

declare global {
  interface IProps {
    feedbackAnchorEl?: null | HTMLElement;
    feedbackMenuId?: string;
    isFeedbackOpen?: boolean;
    handleMenuClose?: () => void;
  }
}

export function FeedbackMenu ({ handleMenuClose, feedbackAnchorEl, feedbackMenuId, isFeedbackOpen }: IProps): React.JSX.Element {

  const [postGroupFeedback] = sh.usePostGroupFeedbackMutation();
  const [postSiteFeedback] = sh.usePostSiteFeedbackMutation();
  
  const [feedbackTarget, setFeedbackTarget] = useState('site');
  const [message, setMessage] = useState('');

  const handleSubmit = useCallback(function() {
    if (message) {
      ('site' === feedbackTarget ? postSiteFeedback : postGroupFeedback)({ message }).catch(console.error);
      setMessage('');
      handleMenuClose && handleMenuClose();
    }
  }, [message])

  return <Menu
    anchorEl={feedbackAnchorEl}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    id={feedbackMenuId}
    keepMounted
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    open={!!isFeedbackOpen}
    onClose={handleMenuClose}
  >
    <Box p={1} sx={{ width: 300 }}>
      <Grid spacing={2} container direction="row">
        <Grid item xs={12}>
          <TextField
            select
            fullWidth
            value={feedbackTarget}
            label="Group or Site"
            variant="standard"
            onChange={e => setFeedbackTarget(e.target.value) }
          >
            <MenuItem key={`site-select-give-feedback`} value={'site'}>Site</MenuItem>
            <MenuItem key={`group-select-give-feedback`} value={'group'}>Group</MenuItem>
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            autoFocus
            rows={4}
            inputProps={{ maxLength: 300 }}
            helperText={`${300 - message.length}/300`}
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.stopPropagation()}
          />
        </Grid>
        <Grid item xs={12}>
          <Button fullWidth onClick={handleSubmit}>Submit Comment</Button>
        </Grid>
      </Grid>
    </Box>
  </Menu>
}

export default FeedbackMenu ;