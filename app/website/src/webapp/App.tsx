import React, { Suspense } from 'react';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import deepmerge from '@mui/utils/deepmerge';
import createTheme from '@mui/material/styles/createTheme';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useRedux, useComponents } from 'awayto-hooks';

import { getBaseComponents, getDesignTokens, getThemedComponents } from './style';

import './App.css';

const App = (props: IProps): JSX.Element => {

  const { Layout } = useComponents();
  const { theme } = useRedux(state => state.util);

  const defaultTheme = useMediaQuery('(prefers-color-scheme: dark)') ? 'dark' : 'light';
  const currentTheme = React.useMemo(() => createTheme(deepmerge(deepmerge(getDesignTokens(theme || defaultTheme), getThemedComponents(theme || defaultTheme)), getBaseComponents())), [theme]);

  return <>
    <Suspense>
      <ThemeProvider theme={currentTheme}>
        <Layout {...props} />
      </ThemeProvider>
    </Suspense>
  </>
}

export default App;
