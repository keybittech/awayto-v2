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
import { IUserProfileActionTypes, ILookupActionTypes, SiteRoles, IUtilActionTypes } from 'awayto';
import { useRedux, useApi, useComponents, useAct } from 'awayto-hooks';

import './App.css';

import Layout from './modules/common/views/Layout';

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(function Alert(
  props,
  ref,
) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const {
  REACT_APP_KC_CLIENT
} = process.env as { [prop: string]: string };

const { SET_SNACK } = IUtilActionTypes;
const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { GET_LOOKUPS } = ILookupActionTypes;

const App = (props: IProps): JSX.Element => {

  const api = useApi();
  const act = useAct();
  const { Onboard, ConfirmAction } = useComponents();

  const { isLoading, loadingMessage, theme, snackOn, snackType, snackRequestId } = useRedux(state => state.util);
  const [ready, setReady] = useState(false);
  const [onboarding, setOnboarding] = useState(false);

  const defaultTheme = useMediaQuery('(prefers-color-scheme: dark)') ? 'dark' : 'light';
  const currentTheme = React.useMemo(() => createTheme(deepmerge(deepmerge(getDesignTokens(theme || defaultTheme), getThemedComponents(theme || defaultTheme)), getBaseComponents())), [theme]);

  useEffect(() => {
    if (keycloak.authenticated) {

      const [abort1, res] = api(GET_USER_PROFILE_DETAILS);
      const [abort2, rez] = api(GET_LOOKUPS);

      Promise.all([res, rez]).then(([user]) => {
        if (user?.groups?.size) {
          setReady(true);
        } else {
          setOnboarding(true)
        }
      }).catch(console.warn);

      const interval: NodeJS.Timeout = setInterval(() => {
        const resources = keycloak.tokenParsed?.resource_access;
        if (resources && resources[REACT_APP_KC_CLIENT]?.roles.includes(SiteRoles.APP_ROLE_CALL)) {
          api(GET_USER_PROFILE_DETAILS);
        }
      }, 58 * 1000);

      return () => {
        abort1();
        abort2();
        clearInterval(interval);
      }
    }
  }, []);

  const hideSnack = (): void => {
    act(SET_SNACK, { snackOn: '', snackRequestId: '' });
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

        <Backdrop sx={{ zIndex: 9999, color: '#fff' }} open={!!isLoading} >
          <Grid container direction="column" alignItems="center">
            <CircularProgress color="inherit" />
            {loadingMessage && <Box m={4}>
              <Typography variant="caption">{loadingMessage}</Typography>
            </Box>}
          </Grid>
        </Backdrop>
      </ThemeProvider>
    </LocalizationProvider>
  </>
}

export default App;
