import React, { useContext } from 'react';

import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Menu from '@mui/material/Menu';
import Checkbox from '@mui/material/Checkbox';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListItemButton from '@mui/material/ListItemButton';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import ApprovalIcon from '@mui/icons-material/Approval';
import DoNotDisturbIcon from '@mui/icons-material/DoNotDisturb';
import { shortNSweet } from 'awayto';
import { PendingQuotesContext, PendingQuotesContextType } from './PendingQuotesContext';

declare global {
  interface IProps {
    pendingQuotesAnchorEl?: null | HTMLElement;
    pendingQuotesMenuId?: string;
    isPendingQuotesOpen?: boolean;
    handleMenuClose?: () => void;
  }
}

export function PendingQuotesMenu({ handleMenuClose, pendingQuotesAnchorEl, pendingQuotesMenuId, isPendingQuotesOpen }: IProps): JSX.Element {

  const {
    pendingQuotes,
    selectedPendingQuotes,
    handleSelectPendingQuote,
    handleSelectPendingQuoteAll,
    approvePendingQuotes,
    denyPendingQuotes
  } = useContext(PendingQuotesContext) as PendingQuotesContextType;

  return <Menu
    anchorEl={pendingQuotesAnchorEl}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'left',
    }}
    id={pendingQuotesMenuId}
    keepMounted
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    open={!!isPendingQuotesOpen}
    onClose={handleMenuClose}
  >
    <List>
      {pendingQuotes.length ? <Box sx={{ width: 300 }}>
        <ListItem
          disablePadding
          secondaryAction={!!selectedPendingQuotes.length && <>
            <Tooltip title="Approve">
              <IconButton
                edge="end"
                aria-label={"approve selected pending quotes"}
                onClick={approvePendingQuotes}
              >
                <ApprovalIcon />
              </IconButton>
            </Tooltip>
            &nbsp;&nbsp;&nbsp;
            <Tooltip title="Deny">
              <IconButton
                edge="end"
                aria-label="deny selected pending quotes"
                onClick={denyPendingQuotes}
              >
                <DoNotDisturbIcon />
              </IconButton>
            </Tooltip>
          </>}
        >
          <ListItemButton role={undefined} dense>
            <ListItemIcon>
              <Checkbox
                disableRipple
                tabIndex={-1}
                onClick={handleSelectPendingQuoteAll}
                checked={selectedPendingQuotes.length === pendingQuotes.length && pendingQuotes.length !== 0}
                indeterminate={selectedPendingQuotes.length !== pendingQuotes.length && selectedPendingQuotes.length !== 0}
                disabled={pendingQuotes.length === 0}
                inputProps={{ 'aria-label': 'all pending requests selected' }}
              />
            </ListItemIcon>
            <ListItemText primary="Pending Requests" />
          </ListItemButton>
        </ListItem>

        <Divider />

        {pendingQuotes.map((pq, i) => {
          return <ListItem
            key={`pending_quotes_pqs_${i}`}
            disablePadding
          >
            <ListItemButton role={undefined} onClick={() => handleSelectPendingQuote(pq)} dense>
              <ListItemIcon>
                <Checkbox
                  checked={selectedPendingQuotes.indexOf(pq) !== -1}
                  tabIndex={-1}
                  disableRipple
                  inputProps={{ 'aria-labelledby': `checkbox-list-label-${i}` }}
                />
              </ListItemIcon>
              <ListItemText
                id={`checkbox-list-label-${i}`}
                primary={`${shortNSweet(pq.slotDate, pq.startTime)}`}
                secondary={`${pq.serviceName} ${pq.serviceTierName} with ${pq.username}`}
              />
            </ListItemButton>
          </ListItem>
        })}
      </Box> : <Box sx={{ width: 250 }}>
        <ListItem>
          <ListItemText>No pending requests.</ListItemText>
        </ListItem>
      </Box>}
    </List>
  </Menu>
}

export default PendingQuotesMenu;