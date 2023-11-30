import React, { useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';

import JoinFullIcon from '@mui/icons-material/JoinFull';
import DoneIcon from '@mui/icons-material/Done';

import { bookingDT, dayjs, shortNSweet } from 'awayto/core';
import { useContexts, useUtil } from 'awayto/hooks';

declare global {
  interface IProps {
    upcomingBookingsAnchorEl?: null | HTMLElement;
    upcomingBookingsMenuId?: string;
    isUpcomingBookingsOpen?: boolean;
    handleMenuClose?: () => void;
  }
}

export function UpcomingBookingsMenu({ handleMenuClose, upcomingBookingsAnchorEl, upcomingBookingsMenuId, isUpcomingBookingsOpen }: IProps): React.JSX.Element {
  const { exchangeId } = useParams();
  const navigate = useNavigate();
  const { openConfirm } = useUtil();

  const minsAgo15 = dayjs.duration(-15, 'years');
  const startOfDay = dayjs().startOf('day');

  const { bookingValues: upcomingBookings } = useContext(useContexts().BookingContext) as BookingContextType;

  return exchangeId ? 
  <Tooltip title="Go to Exchange Summary">
    <Button
      color="success"
      aria-label={`go to exchange summary`}
      onClick={() => {
        openConfirm({
          isConfirming: true,
          confirmEffect: `Continue to the Exchange summary.`,
          confirmSideEffect: {
            approvalAction: 'All Done',
            approvalEffect: 'Continue to the Exchange summary.',
            rejectionAction: 'Keep Chatting',
            rejectionEffect: 'Return to the chat.',
          },
          confirmAction: approval => {
            if (approval) {
              navigate(`/exchange/${exchangeId}/summary`);
            }
          }
        });
      }}
      variant="outlined"
      startIcon={<DoneIcon />}
    >
      Go to Summary
    </Button>
  </Tooltip> :
  <Menu
    anchorEl={upcomingBookingsAnchorEl}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    id={upcomingBookingsMenuId}
    keepMounted
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    open={!!isUpcomingBookingsOpen}
    onClose={handleMenuClose}
  >
    <List>
      {upcomingBookings.length ? <Box sx={{ width: 300 }}>
        {upcomingBookings.map(({ id, slotDate, startTime, serviceName, serviceTierName }, i) => {

          const dt = bookingDT(slotDate, startTime);

          return <ListItem
            key={`upcoming_appt_ub_${i}`}
            secondaryAction={dayjs().isAfter(dt.add(minsAgo15)) && <>
              <Tooltip title="Join Exchange">
                <Button
                  aria-label={`go to exchange for ${shortNSweet(slotDate, startTime)}`}
                  onClick={() => {
                    navigate(`/exchange/${id}`);
                  }}
                  variant="text"
                  startIcon={<JoinFullIcon />}
                >
                  Join
                </Button>
              </Tooltip>
            </>}
          >
            <ListItemText
              primary={`${shortNSweet(slotDate, startTime)}`}
              secondary={`${serviceName} ${serviceTierName}`}
            />
          </ListItem>
        })}
      </Box> : <Box sx={{ width: 250 }}>
        <ListItem>
          <ListItemText>No upcoming appointments.</ListItemText>
        </ListItem>
      </Box>}
    </List>
  </Menu>
}

export default UpcomingBookingsMenu;
