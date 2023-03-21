import React from 'react';

import Grid from '@mui/material/Grid';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Button from '@mui/material/Button';

import GroupIcon from '@mui/icons-material/Group';
import TtyIcon from '@mui/icons-material/Tty';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import MoreTimeIcon from '@mui/icons-material/MoreTime';
import BusinessIcon from '@mui/icons-material/Business';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { useNavigate, useLocation } from 'react-router-dom';

import Icon from '../../../img/kbt-icon.png';

import keycloak from '../../../keycloak';
import { useSecure, useStyles } from 'awayto-hooks';
import { SiteRoles } from 'awayto';

export function Sidebar(): JSX.Element {
  const hasRole = useSecure();
  const navigate = useNavigate();
  const classes = useStyles();
  const location = useLocation();

  return (
      <Grid container style={{ height: '100vh' }} alignContent="space-between">
        <Grid item xs={12} style={{ marginTop: '20px' }}>
          <Grid container justifyContent="center">
            <Button onClick={() => navigate('/')}>
              <img src={Icon} alt="kbt-icon" className={classes.logo} />
            </Button>
          </Grid>
          <List component="nav">
            <ListItem className={classes.menuIcon} onClick={() => navigate('/')} button key={'home'}>
              <ListItemIcon><GroupIcon color={location.pathname === '/' ? "secondary" : "primary"} /></ListItemIcon>
              <ListItemText classes={{ primary: classes.menuText }}>Home</ListItemText>
            </ListItem>
            <ListItem className={classes.menuIcon} onClick={() => navigate('/exchange')} button key={'exchange'}>
              <ListItemIcon><TtyIcon color={location.pathname === '/exchange' ? "secondary" : "primary"} /></ListItemIcon>
              <ListItemText classes={{ primary: classes.menuText }}>Exchange</ListItemText>
            </ListItem>
            {hasRole([SiteRoles.APP_GROUP_SERVICES]) && <ListItem className={classes.menuIcon} onClick={() => navigate('/service')} button key={'service'}>
                <ListItemIcon><BusinessIcon color={location.pathname === '/service' ? "secondary" : "primary"} /></ListItemIcon>
                <ListItemText classes={{ primary: classes.menuText }}>Service</ListItemText>
              </ListItem>}
            {hasRole([SiteRoles.APP_GROUP_SCHEDULES]) && <ListItem className={classes.menuIcon} onClick={() => navigate('/schedule')} button key={'schedule'}>
              <ListItemIcon><EventNoteIcon color={location.pathname === '/schedule' ? "secondary" : "primary"} /></ListItemIcon>
              <ListItemText classes={{ primary: classes.menuText }}>Schedule</ListItemText>
            </ListItem>}
            {hasRole([SiteRoles.APP_GROUP_BOOKINGS]) && <ListItem className={classes.menuIcon} onClick={() => navigate('/quote/request')} button key={'quote/request'}>
              <ListItemIcon><MoreTimeIcon color={location.pathname === '/quote/request' ? "secondary" : "primary"} /></ListItemIcon>
              <ListItemText classes={{ primary: classes.menuText }}>Request</ListItemText>
            </ListItem>}
          </List>
        </Grid>
        <Grid item xs={12}>
          <List component="nav">
            <ListItem className={classes.menuIcon} onClick={() => navigate('/profile')} button key={'profile'}>
              <ListItemIcon><AccountBoxIcon color={location.pathname === '/profile' ? "secondary" : "primary"} /></ListItemIcon>
              <ListItemText classes={{ primary: classes.menuText }}>Profile</ListItemText>
            </ListItem>
            <ListItem className={classes.menuIcon} onClick={async () => {
              await keycloak.logout({ redirectUri: `https://${process.env.REACT_APP_LAND_HOSTNAME as string}/` });
            }} button key={'logout'}>
              <ListItemIcon><ExitToAppIcon color="primary" /></ListItemIcon>
              <ListItemText classes={{ primary: classes.menuText }}>Logout</ListItemText>
            </ListItem>
          </List>
        </Grid>
      </Grid>
  )
}

export default Sidebar;