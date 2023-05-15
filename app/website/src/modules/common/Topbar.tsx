import React, { useMemo, useState, } from 'react';

import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import Typography from '@mui/material/Typography';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

import CampaignIcon from '@mui/icons-material/Campaign';
import TtyIcon from '@mui/icons-material/Tty';
import ThreePIcon from '@mui/icons-material/ThreeP';
import LogoutIcon from '@mui/icons-material/Logout';
import EventNoteIcon from '@mui/icons-material/EventNote';
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import BusinessIcon from '@mui/icons-material/Business';
import GroupIcon from '@mui/icons-material/Group';
import ApprovalIcon from '@mui/icons-material/Approval';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

import Icon from '../../img/kbt-icon.png';
import keycloak from '../../keycloak';

import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { SiteRoles, PaletteMode } from 'awayto/core';
import { useSecure, useComponents, sh, useAppSelector, useUtil, useStyles } from 'awayto/hooks';

declare global {
  interface IProps {
    forceSiteMenu?: boolean;
  }
}

export function Topbar(props: IProps): React.JSX.Element {

  const { exchangeId } = useParams();
  const classes = useStyles();
  const navigate = useNavigate();
  const hasRole = useSecure();
  const { FeedbackMenu, PendingQuotesMenu, PendingQuotesProvider, UpcomingBookingsMenu } = useComponents();
  const location = useLocation();

  const { theme } = useAppSelector(state => state.util);
  const { setTheme } = useUtil();

  const { data: profile } = sh.useGetUserProfileDetailsQuery();

  const pendingQuotes = useMemo(() => Object.values(profile?.quotes || {}), [profile]);
  const upcomingBookings = useMemo(() => Object.values(profile?.bookings || {}), [profile]);

  const mobileMenuId = 'mobile-app-bar-menu';
  const pendingQuotesMenuId = 'pending-requests-menu';
  const feedbackMenuId = 'feedback-menu';
  const upcomingBookingsMenuId = 'upcoming-bookings-menu';

  const [mobileMoreAnchorEl, setMobileMoreAnchorEl] = useState<null | HTMLElement>(null);
  const [pendingQuotesAnchorEl, setPendingQuotesAnchorEl] = useState<null | HTMLElement>(null);
  const [feedbackAnchorEl, setFeedbackAnchorEl] = useState<null | HTMLElement>(null);
  const [upcomingBookingsAnchorEl, setUpcomingBookingsAnchorEl] = useState<null | HTMLElement>(null);

  const isMobileMenuOpen = Boolean(mobileMoreAnchorEl);
  const isPendingQuotesOpen = Boolean(pendingQuotesAnchorEl);
  const isFeedbackOpen = Boolean(feedbackAnchorEl);
  const isUpcomingBookingsOpen = Boolean(upcomingBookingsAnchorEl);

  const handleMenuClose = () => {
    setUpcomingBookingsAnchorEl(null);
    setPendingQuotesAnchorEl(null);
    setFeedbackAnchorEl(null);
    setMobileMoreAnchorEl(null)
  };

  const handleNavAndClose = (path: string) => {
    handleMenuClose();
    navigate(path);
  };

  return <Grid xs={12} container>
    <Grid sx={{ display: { xs: 'flex', md: !props.forceSiteMenu ? 'none' : 'flex' } }}>
      <Tooltip title="Menu">
        <Button
          aria-label="show mobile main menu"
          aria-controls={mobileMenuId}
          aria-haspopup="true"
          onClick={e => setMobileMoreAnchorEl(e.currentTarget)}
        >
          <img src={Icon} alt="kbt-icon" width={48} />
        </Button>
      </Tooltip>
    </Grid>
    <Grid container sx={{ flexGrow: 1, justifyContent: 'right', alignItems: 'center' }}>
      <Grid>
        <UpcomingBookingsMenu
          {...props}
          upcomingBookingsAnchorEl={upcomingBookingsAnchorEl}
          upcomingBookingsMenuId={upcomingBookingsMenuId}
          isUpcomingBookingsOpen={isUpcomingBookingsOpen}
          handleMenuClose={handleMenuClose}
        />

        <Tooltip sx={{ display: !!exchangeId ? 'none' : 'flex' }} title="View Exchanges">
          <IconButton
            disableRipple
            color="primary"
            aria-label={`view ${upcomingBookings.length} exchanges`}
            aria-controls={upcomingBookingsMenuId}
            aria-haspopup="true"
            onClick={e => setUpcomingBookingsAnchorEl(e.currentTarget)}
          >
            <Badge badgeContent={upcomingBookings.length} color="error">
              <ThreePIcon className={classes.mdHide} />
              <Typography className={classes.mdShow}>View</Typography>
            </Badge>
          </IconButton>
        </Tooltip>
      </Grid>
      

      <Grid>
        {/** PENDING REQUESTS MENU */}
        <PendingQuotesProvider>
          <PendingQuotesMenu
            {...props}
            pendingQuotesAnchorEl={pendingQuotesAnchorEl}
            pendingQuotesMenuId={pendingQuotesMenuId}
            isPendingQuotesOpen={isPendingQuotesOpen}
            handleMenuClose={handleMenuClose}
          />
        </PendingQuotesProvider>

        <Tooltip title="Approve Exchanges">
          <IconButton
            disableRipple
            color="primary"
            aria-label={`show ${pendingQuotes.length} pending exchange requests`}
            aria-controls={pendingQuotesMenuId}
            aria-haspopup="true"
            onClick={e => setPendingQuotesAnchorEl(e.currentTarget)}
          >
            <Badge badgeContent={pendingQuotes.length} color="error">
              <ApprovalIcon className={classes.mdHide} />
              <Typography className={classes.mdShow}>Approve</Typography>
            </Badge>
          </IconButton>
        </Tooltip>
      </Grid>

      <FeedbackMenu
        feedbackAnchorEl={feedbackAnchorEl}
        feedbackMenuId={feedbackMenuId}
        isFeedbackOpen={isFeedbackOpen}
        handleMenuClose={handleMenuClose}
      />
      <Grid>
        <Tooltip title="Comment">
          <IconButton
            disableRipple
            color="primary"
            aria-label={`submit a group or site comment`}
            aria-controls={feedbackMenuId}
            aria-haspopup="true"
            onClick={e => setFeedbackAnchorEl(e.currentTarget)}
          >
            <CampaignIcon className={classes.mdHide} />
            <Typography className={classes.mdShow}>Comment</Typography>
          </IconButton>
        </Tooltip>
      </Grid>
    </Grid>

    {/** MOBILE MENU */}
    <Menu
      anchorEl={mobileMoreAnchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      id={mobileMenuId}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMobileMenuOpen}
      onClose={() => setMobileMoreAnchorEl(null)}
    >
      <Box sx={{ width: 250 }}>
        <MenuList>

          <MenuItem aria-label="navigate to home" onClick={() => handleNavAndClose('/')}>
            <ListItemIcon><GroupIcon color={location.pathname === '/' ? "secondary" : "primary"} /></ListItemIcon>
            <ListItemText>Home</ListItemText>
          </MenuItem>

          <MenuItem aria-label="navigate to profile" onClick={() => handleNavAndClose('/profile')}>
            <ListItemIcon><AccountCircleIcon color={location.pathname === '/profile' ? "secondary" : "primary"} /></ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>

          <MenuItem aria-label="switch between dark and light theme">
            <ListItemText>
              Dark
              <Switch
                value={theme !== 'dark'}
                onChange={e => setTheme({ theme: (e.target.checked ? 'light' : 'dark') as PaletteMode })}
              />
              Light
            </ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem aria-label="navigate to exchange" onClick={() => handleNavAndClose('/exchange')}>
            <ListItemIcon><TtyIcon color={location.pathname === '/exchange' ? "secondary" : "primary"} /></ListItemIcon>
            <ListItemText>Exchange</ListItemText>
          </MenuItem>

          <MenuItem hidden={!hasRole([SiteRoles.APP_GROUP_SERVICES])} aria-label="navigate to create service" onClick={() => handleNavAndClose('/service')}>
            <ListItemIcon><BusinessIcon color={location.pathname === '/service' ? "secondary" : "primary"} /></ListItemIcon>
            <ListItemText>Service</ListItemText>
          </MenuItem>

          <MenuItem hidden={!hasRole([SiteRoles.APP_GROUP_SCHEDULES])} aria-label="navigate to create schedule" onClick={() => handleNavAndClose('/schedule')}>
            <ListItemIcon><EventNoteIcon color={location.pathname === '/schedule' ? "secondary" : "primary"} /></ListItemIcon>
            <ListItemText>Schedule</ListItemText>
          </MenuItem>

          <MenuItem hidden={!hasRole([SiteRoles.APP_GROUP_BOOKINGS])} aria-label="navigate to create request" onClick={() => handleNavAndClose('/quote/request')}>
            <ListItemIcon><MoreTimeIcon color={location.pathname === '/quote/request' ? "secondary" : "primary"} /></ListItemIcon>
            <ListItemText>Request</ListItemText>
          </MenuItem>

          <Divider />

          <MenuItem aria-label="logout of the application" onClick={() => {
            async function go() {
              await keycloak.logout({
                redirectUri: `https://${process.env.REACT_APP_LAND_HOSTNAME as string}/`
              });
            }
            void go();
          }}>
            <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
            <ListItemText>Logout</ListItemText>
          </MenuItem>

        </MenuList>
      </Box>
    </Menu>
  </Grid>;
}

export default Topbar;