import React, { Suspense, useMemo } from 'react';
import { Route, Outlet, Routes } from 'react-router-dom';

import Grid from '@mui/material/Unstable_Grid2';
import CircularProgress from '@mui/material/CircularProgress';

import CssBaseline from '@mui/material/CssBaseline';

import { useComponents } from 'awayto/hooks';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = (props: IProps): React.JSX.Element => {

  const { Home, Exchange, ExchangeSummary, ExchangeProvider, TopLevelProviders, Profile, GroupPaths, ServiceHome, ScheduleHome, RequestQuote } = useComponents();

  return useMemo(() => <>
    <CssBaseline />
    <TopLevelProviders>
      <Routes>
        <Route element={
          <Grid container direction="row">
            <Grid width={175} sx={{ bgcolor: 'primary.dark', position: 'fixed', minWidth: '175px', display: { xs: 'none', md: 'flex' } }}>
              <Sidebar />
            </Grid>
            <Grid xs={12} container direction="column" sx={{ marginLeft: { xs: 0, md: '175px' } }}>
              <Grid px={1} sx={{ bgcolor: 'primary.dark' }}>
                <Topbar {...props} />
              </Grid>
              <Grid p={2} sx={{ width: '100%', height: 'calc(100vh - 75px)' }}>
                <Suspense fallback={<CircularProgress color="inherit" />}>
                  <Outlet />
                </Suspense>
              </Grid>
            </Grid>
          </Grid>
        }>
          <Route path="/" element={<Home {...props} />} />
          <Route path="/profile" element={<Profile {...props} />} />
          <Route path="/service" element={<ServiceHome {...props} />} />
          <Route path="/quote/request" element={<RequestQuote {...props} />} />
          <Route path="/schedule" element={<ScheduleHome {...props} />} />
          <Route path="/group/:groupName/*" element={<GroupPaths {...props} />} />
          <Route path="/exchange/:summaryId/summary" element={<ExchangeSummary {...props} />} />
        </Route>
        <Route element={
          <Grid xs={12} container>
            <Grid xs={12} px={1} sx={{ bgcolor: 'primary.dark' }}>
              <Topbar forceSiteMenu={true} {...props} />
            </Grid>
            <Grid p={2} sx={{ width: '100%', height: 'calc(100vh - 75px)' }}>
              <Suspense fallback={<CircularProgress color="inherit" />}>
                <ExchangeProvider>
                  <Outlet />
                </ExchangeProvider>
              </Suspense>
            </Grid>
          </Grid>
        }>
          <Route path="/exchange/:exchangeId" element={<Exchange {...props} />} />
        </Route>
      </Routes >
    </TopLevelProviders >
  </>, []);
}

export default Layout;
