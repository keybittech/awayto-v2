import Icon from './img/kbt-icon.png';

import React, { Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';
import { Skeleton } from '@material-ui/lab';
import MomentUtils from '@date-io/moment';
import withStyles from '@material-ui/core/styles/withStyles';

import Drawer from '@material-ui/core/Drawer';
import Grid from '@material-ui/core/Grid';
import Snackbar from '@material-ui/core/Snackbar';
import Toolbar from '@material-ui/core/Toolbar';
import CircularProgress from '@material-ui/core/CircularProgress';
import Backdrop from '@material-ui/core/Backdrop';
import AppBar from '@material-ui/core/AppBar';
import Box from '@material-ui/core/Box';

import keycloak from './keycloak';

import { IUtilActionTypes, IUserProfileActionTypes, IFormActionTypes } from 'awayto';
import { useRedux, useAct, useComponents, useApi } from 'awayto-hooks';

import './App.css';
import { ThemeProvider } from '@material-ui/styles';
import { CssBaseline } from '@material-ui/core';
import { themes, styles } from './style';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';

const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { GET_FORMS } = IFormActionTypes;

function Alert(props: AlertProps): JSX.Element {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const { SET_SNACK } = IUtilActionTypes;

const App = (props: IProps): JSX.Element => {

  const { classes } = props;

  const api = useApi();

  const act = useAct();

  const { Sidebar, ConfirmAction, Home, Profile, Manage, ServiceHome, ScheduleHome, BookingHome } = useComponents();
  const { snackOn, snackType, snackRequestId, isLoading, loadingMessage, theme } = useRedux(state => state.util);

  const hideSnack = (): void => {
    act(SET_SNACK, { snackOn: '', snackRequestId: '' });
  }

  useEffect(() => {
    if (keycloak.authenticated) {
      void api(GET_USER_PROFILE_DETAILS);
      void api(GET_FORMS);
    }
  }, [])

  return <>
    <MuiPickersUtilsProvider utils={MomentUtils}>
      <ThemeProvider theme={themes[theme || 'dark']}>
        <CssBaseline />

        <div className={classes.root}>
          <AppBar position="fixed" className={classes.appBar}>
            <Toolbar />
          </AppBar>
          <Suspense fallback={
            <Drawer className={classes.drawer} variant="permanent" classes={{ paper: classes.drawerPaper }} >
              <Grid container style={{ height: '100vh' }} alignContent="space-between">
                <Grid item xs={12} style={{ marginTop: '20px' }}>
                  <Grid container justifyContent="center">
                    <img src={Icon} alt="kbt-icon" className={classes.logo} />
                  </Grid>
                  <Grid container style={{ padding: '10px' }}>
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="100%" />
                    <Skeleton variant="text" width="100%" />
                  </Grid>
                </Grid>
              </Grid>
            </Drawer>
          }>
            <Sidebar {...props} />
          </Suspense>
          <main className={classes.content}>
            <div className={classes.toolbar} />
            <Suspense fallback={
              <Grid container direction="row">
                <AppBar position="fixed" className={classes.appBar}>
                  <Toolbar />
                </AppBar>
                <Grid container spacing={4} style={{ padding: '20px 20px 40px' }}>
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="rect" width="100%" height="150px" animation="pulse" />
                </Grid>
                <Grid container spacing={4} style={{ padding: '20px' }}>
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="rect" width="100%" height="150px" animation="pulse" />
                </Grid>
              </Grid >
            }>
              <Routes>
                <Route path="/" element={<Home {...props} />} />
                <Route path="/profile" element={<Profile {...props} />} />
                <Route path="/service" element={<ServiceHome {...props} />} />
                <Route path="/schedule" element={<ScheduleHome {...props} />} />
                <Route path="/booking" element={<BookingHome {...props} />} />
                <Route path="/manage/:component" element={<Manage {...props} />} />
              </Routes>
            </Suspense>
          </main>
        </div>

        {!!snackOn && <Snackbar open={!!snackOn} autoHideDuration={15000} onClose={hideSnack}>
          <Alert onClose={hideSnack} severity={snackType || "info"}>
            <Box>{snackOn}</Box>
            <Box><sub>{snackRequestId}</sub></Box>
          </Alert>
        </Snackbar>}

        <Suspense fallback="">
          <ConfirmAction {...props} />
        </Suspense>

        <Backdrop className={classes.backdrop} open={!!isLoading} >
          <Grid container direction="column" alignItems="center">
            <CircularProgress color="inherit" />
            {loadingMessage ?? ''}
          </Grid>
        </Backdrop>

      </ThemeProvider>
    </MuiPickersUtilsProvider>
  </>
}

export default withStyles(styles)(App);
