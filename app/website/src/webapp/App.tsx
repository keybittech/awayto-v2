import Icon from './img/kbt-icon.png';

import React, { Suspense, useEffect, useState } from 'react';
import ThemeProvider from '@mui/styles/ThemeProvider';
import { useRedux, useComponents } from 'awayto-hooks';

import { Theme } from '@mui/material/styles/createTheme';
import CssBaseline from '@mui/material/CssBaseline';
import { themes } from './style';

import './App.css';

const App = (props: Partial<IProps>): JSX.Element => {

  const [currentTheme, setCurrentTheme] = useState<Theme>(themes['dark']);

  const { Layout } = useComponents();
  const { theme } = useRedux(state => state.util);

  useEffect(() => {
    if (theme) {
      setCurrentTheme(themes[theme]);
      console.log('new theme')
    }
  }, [theme]);

  return <>
  <Suspense>
    <ThemeProvider theme={currentTheme}>
      <CssBaseline />
        <Layout theme={currentTheme} {...props} />
    </ThemeProvider>
      </Suspense>
  </>
}

export default App;
