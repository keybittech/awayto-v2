import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import { useUtil, sh, useAppSelector, useComponents, lightTheme, darkTheme, useContexts } from 'awayto/hooks';

import Layout from './Layout';

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
  const location = useLocation();
  const navigate = useNavigate();

  const { AuthContext } = useContexts();
  const { keycloak, refreshToken } = useContext(AuthContext) as AuthContextType;

  const { setSnack, setTheme } = useUtil();
  const { Onboard, ConfirmAction } = useComponents();
  const { theme, snackOn, snackType, snackRequestId, isLoading, loadingMessage } = useAppSelector(state => state.util);
  
  const [ready, setReady] = useState(false);
  const [onboarding, setOnboarding] = useState(false);
  
  const { data: profile, refetch: getUserProfileDetails } = sh.useGetUserProfileDetailsQuery();
  
  const [attachUser] = sh.useAttachUserMutation();
  const [activateProfile] = sh.useActivateProfileMutation();

  if (!theme) {
    setTheme({ theme: localStorage.getItem('site_theme') || 'dark' })
  }

  const hideSnack = (): void => {
    setSnack({ snackOn: '', snackRequestId: '' });
  }

  const reloadProfile = async (): Promise<void> => {
    await refreshToken().then(() => {
      void getUserProfileDetails();
      navigate('/');
    }).catch(console.error);
  }

  useEffect(() => {
    const interval: NodeJS.Timeout = setInterval(() => {
      const resources = keycloak.tokenParsed?.resource_access;
      if (resources && resources[REACT_APP_KC_CLIENT]?.roles.includes(SiteRoles.APP_ROLE_CALL)) {
        void getUserProfileDetails();
      }
    }, 58 * 1000);

    return () => {
      clearInterval(interval);
    }
  }, []);

  useEffect(() => {
    if (!profile) return;

    if (location.pathname === "/registration/code/success") {
      const code = location.search.split('?code=')[1].split('&')[0];
      attachUser({ code }).unwrap().then(async () => {
        await activateProfile().unwrap().catch(console.error);
        await reloadProfile().catch(console.error);
      }).catch(console.error);
    } else if (!profile.active) {
      setOnboarding(true);
    } else if (profile.active) {
      setOnboarding(false);
      setReady(true);
    }
  }, [profile]);

  return <>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={'light' === theme ? lightTheme : darkTheme}>
        {onboarding && <Onboard {...props} reloadProfile={reloadProfile} />}
        {ready && <Layout {...props} />}
        {!!snackOn && <Snackbar
          sx={{
            '.MuiSvgIcon-root': {
              color: 'black'
            }
          }}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center'
          }}
          open={!!snackOn}
          autoHideDuration={15000}
          onClose={hideSnack}
        >
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
