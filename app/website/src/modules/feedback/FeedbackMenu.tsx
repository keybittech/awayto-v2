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

export function FeedbackMenu ({ handleMenuClose, feedbackAnchorEl, feedbackMenuId, isFeedbackOpen }: IProps): JSX.Element {

  const [postFeedback] = sh.usePostGroupFeedbackMutation();

  const { data: profile } = sh.useGetUserProfileDetailsQuery();
  
  const groupsValues = useMemo(() => Object.values(profile?.groups || {}), [profile]);
  
  const [group, setGroup] = useState(groupsValues[0]);
  const [feedbackTarget, setFeedbackTarget] = useState('site');
  const [message, setMessage] = useState('');

  const handleSubmit = useCallback(function() {
    if (message && handleMenuClose) {
      postFeedback({ message, groupName: group.name }).catch(console.error);
      setMessage('');
      handleMenuClose();
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
            {groupsValues.map(group => <MenuItem key={`group-select${group.id}`} value={group.id}>{group.name}</MenuItem>)}
          </TextField>
        </Grid>
        {'site' !== feedbackTarget && profile?.groups && profile?.groups.length && <>
          <pre>{JSON.stringify(profile?.groups[feedbackTarget], null, 2)}</pre>
        </>}
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
          />
        </Grid>
        <Grid item xs={12}>
          <Button fullWidth onClick={handleSubmit}>Submit Feedback</Button>
        </Grid>
      </Grid>
    </Box>
  </Menu>
}

export default FeedbackMenu ;