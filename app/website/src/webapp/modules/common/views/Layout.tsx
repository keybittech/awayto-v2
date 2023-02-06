import Icon from '../../../img/kbt-icon.png';

import React, { Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import Toolbar from '@mui/material/Toolbar';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';

import keycloak from '../../../keycloak';
import { useStyles } from '../../../style';

import { IUtilActionTypes, IUserProfileActionTypes, IFormActionTypes } from 'awayto';
import { useRedux, useAct, useComponents, useApi } from 'awayto-hooks';

const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { GET_FORMS } = IFormActionTypes;
const { SET_SNACK } = IUtilActionTypes;

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// function Alert(props: AlertProps): JSX.Element {
//   return <MuiAlert elevation={6} variant="filled" {...props} />;
// }

const Layout = (props: IProps): JSX.Element => {

  const classes = useStyles();

  const api = useApi();

  const act = useAct();

  const { Sidebar, ConfirmAction, Home, Profile, Manage, ServiceHome, ScheduleHome, BookingHome } = useComponents();
  const { snackOn, snackType, snackRequestId, isLoading, loadingMessage } = useRedux(state => state.util);

  const hideSnack = (): void => {
    act(SET_SNACK, { snackOn: '', snackRequestId: '' });
  }

  useEffect(() => {
    if (keycloak.authenticated) {
      void api(GET_USER_PROFILE_DETAILS);
      void api(GET_FORMS);
    }
  }, []);

  return <>
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
              <Skeleton variant="rectangular" width="100%" height="150px" animation="pulse" />
            </Grid>
            <Grid container spacing={4} style={{ padding: '20px' }}>
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="rectangular" width="100%" height="150px" animation="pulse" />
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

    {!!snackOn && <Snackbar anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} open={!!snackOn} autoHideDuration={15000} onClose={hideSnack}>
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
  </>
}

export default Layout;
