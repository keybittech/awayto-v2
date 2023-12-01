import React, { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
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

import Icon from '../../img/kbt-icon.png';

import { useSecure, useStyles, useContexts } from 'awayto/hooks';
import { SiteRoles } from 'awayto/core';

export function Sidebar(): React.JSX.Element {
  const hasRole = useSecure();
  const navigate = useNavigate();
  const classes = useStyles();
  const location = useLocation();

  const { AuthContext } = useContexts();
  const { keycloak } = useContext(AuthContext) as AuthContextType;

  return <Grid container style={{ height: '100vh' }} alignContent="space-between">
    <Grid item xs={12} style={{ marginTop: '20px' }}>
      <Grid container justifyContent="center">
        <Button sx={classes.logo} onClick={() => navigate('/')}>
          <img src={Icon} alt="kbt-icon" />
        </Button>
      </Grid>
      <List component="nav">
        <ListItem sx={classes.menuIcon} onClick={() => navigate('/')} button key={'home'}>
          <ListItemIcon><GroupIcon color={location.pathname === '/' ? "secondary" : "primary"} /></ListItemIcon>
          <ListItemText sx={classes.menuText}>Home</ListItemText>
        </ListItem>
        {/* <ListItem sx={classes.menuIcon} onClick={() => navigate('/exchange')} button key={'exchange'}>
          <ListItemIcon><TtyIcon color={location.pathname === '/exchange' ? "secondary" : "primary"} /></ListItemIcon>
          <ListItemText sx={classes.menuText}>Exchange</ListItemText>
        </ListItem> */}
        {/* {hasRole([SiteRoles.APP_GROUP_SERVICES]) && <ListItem sx={classes.menuIcon} onClick={() => navigate('/service')} button key={'service'}>
          <ListItemIcon><BusinessIcon color={location.pathname === '/service' ? "secondary" : "primary"} /></ListItemIcon>
          <ListItemText sx={classes.menuText}>Service</ListItemText>
        </ListItem>} */}
        {hasRole([SiteRoles.APP_GROUP_SCHEDULES]) && <ListItem sx={classes.menuIcon} onClick={() => navigate('/schedule')} button key={'schedule'}>
          <ListItemIcon><EventNoteIcon color={location.pathname === '/schedule' ? "secondary" : "primary"} /></ListItemIcon>
          <ListItemText sx={classes.menuText}>Schedule</ListItemText>
        </ListItem>}
        {hasRole([SiteRoles.APP_GROUP_BOOKINGS]) && <ListItem sx={classes.menuIcon} onClick={() => navigate('/quote/request')} button key={'quote/request'}>
          <ListItemIcon><MoreTimeIcon color={location.pathname === '/quote/request' ? "secondary" : "primary"} /></ListItemIcon>
          <ListItemText sx={classes.menuText}>Request</ListItemText>
        </ListItem>}
      </List>
    </Grid>
    <Grid item xs={12}>
      <List component="nav">
        <ListItem sx={classes.menuIcon} onClick={() => navigate('/profile')} button key={'profile'}>
          <ListItemIcon><AccountBoxIcon color={location.pathname === '/profile' ? "secondary" : "primary"} /></ListItemIcon>
          <ListItemText sx={classes.menuText}>Profile</ListItemText>
        </ListItem>
        <ListItem sx={classes.menuIcon} onClick={() => {
          async function go() {
            await keycloak.logout({ redirectUri: `https://${process.env.REACT_APP_LAND_HOSTNAME as string}/` });
          }
          void go();
        }} button key={'logout'}>
          <ListItemIcon><ExitToAppIcon color="primary" /></ListItemIcon>
          <ListItemText sx={classes.menuIcon}>Logout</ListItemText>
        </ListItem>
      </List>
    </Grid>
  </Grid>
}

export default Sidebar;
