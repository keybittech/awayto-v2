import React, { useEffect, useState } from 'react';
import keycloak from './keycloak';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import ThemeProvider from '@mui/material/styles/ThemeProvider';
import deepmerge from '@mui/utils/deepmerge';
import createTheme from '@mui/material/styles/createTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { getBaseComponents, getDesignTokens, getThemedComponents } from './hooks/useStyles';
import { IUserProfileActionTypes, ILookupActionTypes, SiteRoles } from 'awayto';
import { useRedux, useApi } from 'awayto-hooks';

import './App.css';

import Layout from './modules/common/views/Layout';

const {
  REACT_APP_KC_CLIENT
} = process.env as { [prop: string]: string };

const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { GET_LOOKUPS } = ILookupActionTypes;


const App = (props: IProps): JSX.Element => {
  const api = useApi();

  const { theme } = useRedux(state => state.util);
  const [ready, setReady] = useState(false);

  const defaultTheme = useMediaQuery('(prefers-color-scheme: dark)') ? 'dark' : 'light';
  const currentTheme = React.useMemo(() => createTheme(deepmerge(deepmerge(getDesignTokens(theme || defaultTheme), getThemedComponents(theme || defaultTheme)), getBaseComponents())), [theme]);

  useEffect(() => {
    if (keycloak.authenticated) {
      
      const [abort1, res] = api(GET_USER_PROFILE_DETAILS);
      const [abort2, rez] = api(GET_LOOKUPS);

      Promise.all([res, rez]).then(() => {
        setReady(true);
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

  return <>
    {ready && <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={currentTheme}>
        <Layout {...props} />
      </ThemeProvider>
    </LocalizationProvider>}
  </>
}

export default App;
