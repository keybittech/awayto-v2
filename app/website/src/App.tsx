import React, { useEffect, useState } from 'react';
import keycloak from './keycloak';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import Box from '@mui/material/Box';
import Snackbar from '@mui/material/Snackbar';
import Backdrop from '@mui/material/Backdrop';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import MuiAlert, { AlertProps } from '@mui/material/Alert';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { SiteRoles } from 'awayto/core';
import { useUtil, sh, useAppSelector, useComponents, lightTheme, darkTheme } from 'awayto/hooks';

import './App.css';

import Layout from './modules/common/Layout';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const {
  REACT_APP_KC_CLIENT
} = process.env as { [prop: string]: string };

export default function App (props: IProps): React.JSX.Element {
  const { setSnack, setTheme } = useUtil();
  const { Onboard, ConfirmAction } = useComponents();
  const { theme, snackOn, snackType, snackRequestId, isLoading, loadingMessage } = useAppSelector(state => state.util);
  const { data: profile, refetch } = sh.useGetUserProfileDetailsQuery();
  
  const [ready, setReady] = useState(false);
  const [onboarding, setOnboarding] = useState(false);

  if (!theme) {
    setTheme({ theme: localStorage.getItem('site_theme') || 'dark' })
  }

  useEffect(() => {
    const interval: NodeJS.Timeout = setInterval(() => {
      const resources = keycloak.tokenParsed?.resource_access;
      if (resources && resources[REACT_APP_KC_CLIENT]?.roles.includes(SiteRoles.APP_ROLE_CALL)) {
        void refetch();
      }
    }, 58 * 1000);

    return () => {
      clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (profile) {
      if (Object.keys(profile.groups || {}).length) {
        setReady(true);
      } else {
        setOnboarding(true)
      }
    }
  }, [profile]);

  const hideSnack = (): void => {
    setSnack({ snackOn: '', snackRequestId: '' })
  }

  return <>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={'light' === theme ? lightTheme : darkTheme}>
        {onboarding && <Onboard {...props} />}
        {ready && <Layout {...props} />}
        {!!snackOn && <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center' }} open={!!snackOn} autoHideDuration={15000} onClose={hideSnack}>
          <Alert onClose={hideSnack} severity={snackType || "info"}>
            <Box>{snackOn}</Box>
            <Box><sub>{snackRequestId}</sub></Box>
          </Alert>
        </Snackbar>}

        <ConfirmAction {...props} />

        {!!isLoading && <Backdrop sx={{ zIndex: 9999, color: '#fff' }} open={!!isLoading}>
          <Grid container direction="column" alignItems="center">
            <CircularProgress color="inherit" />
            {loadingMessage && <Box m={4}>
              <Typography variant="caption">{loadingMessage}</Typography>
            </Box>}
          </Grid>
        </Backdrop>}
      </ThemeProvider>
    </LocalizationProvider>
  </>
}
