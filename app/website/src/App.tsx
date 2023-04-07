import React, { useEffect, useState, Suspense } from 'react';
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
import deepmerge from '@mui/utils/deepmerge';
import createTheme from '@mui/material/styles/createTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { getBaseComponents, getDesignTokens, getThemedComponents } from './hooks/useStyles';
import { SiteRoles } from 'awayto/core';
import { useUtil, sh, useAppSelector, useComponents } from 'awayto/hooks';

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

export default function App (props: IProps): JSX.Element {
  const { setSnack } = useUtil();
  const { Onboard, ConfirmAction } = useComponents();
  const { theme, snackOn, snackType, snackRequestId, isLoading, loadingMessage } = useAppSelector(state => state.util);
  const { data: profile, refetch } = sh.useGetUserProfileDetailsQuery();
  
  const [ready, setReady] = useState(false);
  const [onboarding, setOnboarding] = useState(false);

  const defaultTheme = useMediaQuery('(prefers-color-scheme: dark)') ? 'dark' : 'light';
  const currentTheme = React.useMemo(() => createTheme(deepmerge(deepmerge(getDesignTokens(theme || defaultTheme), getThemedComponents(theme || defaultTheme)), getBaseComponents())), [theme]);

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
      <ThemeProvider theme={currentTheme}>
        {onboarding && <Suspense>
          <Onboard {...props} />
        </Suspense>}
        {ready && <Layout {...props} />}
        {!!snackOn && <Snackbar anchorOrigin={{ vertical: 'top', horizontal: 'center' }} open={!!snackOn} autoHideDuration={15000} onClose={hideSnack}>
          <Alert onClose={hideSnack} severity={snackType || "info"}>
            <Box>{snackOn}</Box>
            <Box><sub>{snackRequestId}</sub></Box>
          </Alert>
        </Snackbar>}

        <Suspense fallback="">
          <ConfirmAction {...props} />
        </Suspense>

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
