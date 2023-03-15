import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';

import { IUtilActionTypes } from 'awayto';
import { useRedux, useAct, useComponents, useStyles } from 'awayto-hooks';
import { Typography } from '@mui/material';

import Home from './Home';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

const { SET_SNACK } = IUtilActionTypes;

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const Layout = (props: IProps): JSX.Element => {

  const classes = useStyles();

  const act = useAct();

  const { Exchange, ExchangeProvider, ConfirmAction, Profile, GroupPaths, ServiceHome, ScheduleHome, RequestQuote } = useComponents();
  const { snackOn, snackType, snackRequestId, isLoading, loadingMessage } = useRedux(state => state.util);

  const hideSnack = (): void => {
    act(SET_SNACK, { snackOn: '', snackRequestId: '' });
  }

  return <>
    <CssBaseline />
    <div className={classes.root}>
      <Topbar {...props} />
      <Sidebar />

      <main className={classes.content}>
        <div className={classes.toolbar} />
        <Suspense fallback={
          <Grid container direction="row">
            <AppBar position="fixed" className={classes.appBar}>
              <Topbar />
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
            <Route path="/profile"  element={<Profile {...props} />} />
            <Route path="/service" element={<ServiceHome {...props} />} />
            <Route path="/quote/request" element={<RequestQuote {...props} />} />
            <Route path="/schedule" element={<ScheduleHome {...props} />} />
            <Route path="/group/:groupName/*" element={<GroupPaths {...props} />} />
            <Route path="/exchange" element={
              <ExchangeProvider>
                <Exchange {...props} />
              </ExchangeProvider>
            } />
          </Routes>
        </Suspense>
      </main>
    </div>

    {!!snackOn && <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center' }} open={!!snackOn} autoHideDuration={15000} onClose={hideSnack}>
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
        {loadingMessage && <Box m={4}>
          <Typography variant="caption">{loadingMessage}</Typography>
        </Box>}
      </Grid>
    </Backdrop>
  </>
}

export default Layout;
