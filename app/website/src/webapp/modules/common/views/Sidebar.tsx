import React from 'react';
import { Grid, Drawer, List, ListItem, ListItemIcon, ListItemText, Button } from '@mui/material';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import AppsIcon from '@mui/icons-material/Apps';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import BusinessIcon from '@mui/icons-material/Business';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { useNavigate, useLocation } from 'react-router-dom';

import Icon from '../../../img/kbt-icon.png';

import keycloak from '../../../keycloak';
import { useStyles } from '../../../style';

export function Sidebar (props: IProps): JSX.Element {

  const classes = useStyles();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      className={classes.drawer}
      variant="permanent"
      classes={{
        paper: classes.drawerPaper,
      }}
    >
      <Grid container style={{ height: '100vh' }} alignContent="space-between">
        <Grid item xs={12} style={{ marginTop: '20px' }}>
          <Grid container justifyContent="center">
            <Button onClick={() => navigate('/')}>
              <img src={Icon} alt="kbt-icon" className={classes.logo} />
            </Button>
          </Grid>
          <List component="nav">
            <ListItem className={classes.menuIcon} onClick={() => navigate('/')} button key={'home'}>
              <ListItemIcon><VpnKeyIcon color={location.pathname === '/' ? "secondary" : "primary"} /></ListItemIcon>
              <ListItemText classes={{ primary: classes.menuText }}>Home</ListItemText>
            </ListItem>
            <ListItem className={classes.menuIcon} onClick={() => navigate('/manage/users')} button key={'manage'}>
              <ListItemIcon><AppsIcon color={location.pathname === '/manage/users' ? "secondary" : "primary"} /></ListItemIcon>
              <ListItemText classes={{ primary: classes.menuText }}>Manage</ListItemText>
            </ListItem>
            <ListItem className={classes.menuIcon} onClick={() => navigate('/service')} button key={'service'}>
              <ListItemIcon><BusinessIcon color={location.pathname === '/service' ? "secondary" : "primary"} /></ListItemIcon>
              <ListItemText classes={{ primary: classes.menuText }}>Service</ListItemText>
            </ListItem>
            <ListItem className={classes.menuIcon} onClick={() => navigate('/schedule')} button key={'schedule'}>
              <ListItemIcon><EventNoteIcon color={location.pathname === '/schedule' ? "secondary" : "primary"} /></ListItemIcon>
              <ListItemText classes={{ primary: classes.menuText }}>Schedule</ListItemText>
            </ListItem>
            <ListItem className={classes.menuIcon} onClick={() => navigate('/booking')} button key={'booking'}>
              <ListItemIcon><LibraryBooksIcon color={location.pathname === '/booking' ? "secondary" : "primary"} /></ListItemIcon>
              <ListItemText classes={{ primary: classes.menuText }}>Booking</ListItemText>
            </ListItem>
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
    </Drawer>
  )
}

export default Sidebar;