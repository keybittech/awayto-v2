import Icon from './img/kbt-icon.png';

import React, { Suspense, useEffect, useState } from 'react';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import deepmerge from '@mui/utils/deepmerge';
import createTheme from '@mui/material/styles/createTheme';
import { useRedux, useComponents } from 'awayto-hooks';

import { getBaseComponents, getDesignTokens, getThemedComponents } from './style';

// import './App.css';

const App = (props: Partial<IProps>): JSX.Element => {

  const { Layout } = useComponents();
  const { theme } = useRedux(state => state.util);

  const currentTheme = React.useMemo(() => createTheme(deepmerge(deepmerge(getDesignTokens(theme || 'dark'), getThemedComponents(theme || 'dark')), getBaseComponents())), [theme]);

  return <>
    <Suspense>
      <ThemeProvider theme={currentTheme}>
        <Layout {...props} />
      </ThemeProvider>
    </Suspense>
  </>
}

export default App;
