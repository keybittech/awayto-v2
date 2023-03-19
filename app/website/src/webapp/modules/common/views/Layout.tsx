import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Grid';
import AppBar from '@mui/material/AppBar';
import CssBaseline from '@mui/material/CssBaseline';

import { useComponents, useStyles } from 'awayto-hooks';

import Home from './Home';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

const Layout = (props: IProps): JSX.Element => {

  const classes = useStyles();

  const { Exchange, ExchangeProvider, Profile, GroupPaths, ServiceHome, ScheduleHome, RequestQuote } = useComponents();

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
  </>
}

export default Layout;
