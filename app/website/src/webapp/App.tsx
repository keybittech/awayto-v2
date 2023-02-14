import React, { Suspense, useEffect, useState } from 'react';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import deepmerge from '@mui/utils/deepmerge';
import createTheme from '@mui/material/styles/createTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import keycloak from './keycloak';

import { getBaseComponents, getDesignTokens, getThemedComponents } from './hooks/useStyles';
import { IUserProfileActionTypes, IFormActionTypes, SiteRoles } from 'awayto';
import { useRedux, useComponents, useApi } from 'awayto-hooks';

import './App.css';

const {
  REACT_APP_KC_CLIENT
} = process.env as { [prop: string]: string };

const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { GET_FORMS } = IFormActionTypes;

const App = (props: IProps): JSX.Element => {
  const api = useApi();

  const { Layout } = useComponents();
  const { theme } = useRedux(state => state.util);
  const [ready, setReady] = useState(false);

  const defaultTheme = useMediaQuery('(prefers-color-scheme: dark)') ? 'dark' : 'light';
  const currentTheme = React.useMemo(() => createTheme(deepmerge(deepmerge(getDesignTokens(theme || defaultTheme), getThemedComponents(theme || defaultTheme)), getBaseComponents())), [theme]);

  useEffect(() => {
    if (keycloak.authenticated) {
      
      const [abort1, res] = api(GET_USER_PROFILE_DETAILS);
      const [abort2] = api(GET_FORMS);

      res?.then(() => {
        setReady(true);
      });

      const interval: NodeJS.Timeout = setInterval(() => {
        const resources = keycloak.tokenParsed?.resource_access;
        if (resources && resources[REACT_APP_KC_CLIENT].roles.includes(SiteRoles.APP_ROLE_CALL)) {
          api(GET_USER_PROFILE_DETAILS);
        }
      }, 60 * 1000);

      return () => {
        abort1();
        abort2();
        clearInterval(interval);
      }
    }
  }, []);

  return <>
    {ready && <Suspense>
      <ThemeProvider theme={currentTheme}>
        <Layout {...props} />
      </ThemeProvider>
    </Suspense>}
  </>
}

export default App;
