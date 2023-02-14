import React, { Suspense, useEffect, useState } from 'react';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import deepmerge from '@mui/utils/deepmerge';
import createTheme from '@mui/material/styles/createTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import keycloak from './keycloak';

import { getBaseComponents, getDesignTokens, getThemedComponents } from './hooks/useStyles';
import { IUserProfileActionTypes, IFormActionTypes } from 'awayto';
import { useRedux, useComponents, useApi } from 'awayto-hooks';

const { GET_USER_PROFILE_DETAILS } = IUserProfileActionTypes;
const { GET_FORMS } = IFormActionTypes;

import './App.css';

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
      })

      return () => {
        abort1();
        abort2();
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
