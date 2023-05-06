import React, { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import Grid from '@mui/material/Unstable_Grid2';

import CssBaseline from '@mui/material/CssBaseline';

import { useComponents } from 'awayto/hooks';

import Home from './Home';
import Topbar from './Topbar';
import Sidebar from './Sidebar';

const Layout = (props: IProps): JSX.Element => {

  const { Exchange, ExchangeProvider, TopLevelProviders, Profile, GroupPaths, ServiceHome, ScheduleHome, RequestQuote } = useComponents();

  return <>
    <CssBaseline />
    <TopLevelProviders>
      <Grid container direction="row">
        <Grid width={175} sx={{ bgcolor: 'primary.dark', position: 'fixed', minWidth: '175px', display: { xs: 'none', md: 'flex' } }}>
          <Sidebar />
        </Grid>
        <Grid xs={12} container direction="column" sx={{ marginLeft: { xs: 0, md: '175px' } }}>
          <Grid px={1} sx={{ bgcolor: 'primary.dark' }}>
            <Topbar {...props} />
          </Grid>
          <Grid p={2} sx={{ width: '100%', height: 'calc(100vh - 50px)' }}>
            <Routes>
              <Route path="/" element={<Suspense fallback={<></>}><Home {...props} /></Suspense>} />
              <Route path="/profile" element={<Suspense fallback={<></>}><Profile {...props} /></Suspense>} />
              <Route path="/service" element={<Suspense fallback={<></>}><ServiceHome {...props} /></Suspense>} />
              <Route path="/quote/request" element={<Suspense fallback={<></>}><RequestQuote {...props} /></Suspense>} />
              <Route path="/schedule" element={<Suspense fallback={<></>}><ScheduleHome {...props} /></Suspense>} />
              <Route path="/group/:groupName/*" element={<Suspense fallback={<></>}><GroupPaths {...props} /></Suspense>} />
              <Route path="/exchange" element={
                <Suspense fallback={<></>}>
                  <ExchangeProvider>
                    <Exchange {...props} />
                  </ExchangeProvider>
                </Suspense>
              } />
            </Routes>
          </Grid>
        </Grid>
      </Grid>
    </TopLevelProviders>
  </>
}

export default Layout;
