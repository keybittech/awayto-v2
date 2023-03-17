import React, { useCallback, useState } from 'react';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import { useApi, useRedux } from 'awayto-hooks';

import { IFeedbackActionTypes, IGroup } from 'awayto';

const { POST_FEEDBACK } = IFeedbackActionTypes;

declare global {
  interface IProps {
    feedbackAnchorEl?: null | HTMLElement;
    feedbackMenuId?: string;
    isFeedbackOpen?: boolean;
    handleMenuClose?: () => void;
  }
}

export function FeedbackMenu ({ handleMenuClose, feedbackAnchorEl, feedbackMenuId, isFeedbackOpen }: IProps): JSX.Element {

  const api = useApi();

  const { groups } = useRedux(state => state.profile);

  const [group, setGroup] = useState(groups.values().next().value as IGroup);
  const [message, setMessage] = useState('');

  const handleSubmit = useCallback(function() {
    if (message && handleMenuClose) {
      api(POST_FEEDBACK, { message, groupName: group.name });
      setMessage('');
      handleMenuClose();
    }
  }, [message])

  return <Menu
    anchorEl={feedbackAnchorEl}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'left',
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
            fullWidth
            multiline
            autoFocus
            rows={4}
            inputProps={{ maxLength: 300 }}
            value={message}
            onChange={e => setMessage(e.target.value)}
          />
        </Grid>
        <Grid item>
          <TextField
            select
            fullWidth
            value={group.id}
            label="Group"
            variant="standard"
            onChange={e => setGroup(groups.get(e.target.value) as IGroup) }
          >
            {Array.from(groups.values()).map(group => <MenuItem key={`group-select${group.id}`} value={group.id}>{group.name}</MenuItem>)}
          </TextField>
        </Grid>
        <Grid item alignSelf="end">
          <Button fullWidth onClick={handleSubmit}>Submit Feedback</Button>
        </Grid>
      </Grid>
    </Box>
  </Menu>
}

export default FeedbackMenu ;