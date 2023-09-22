export default {};


import React, { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import type { Theme } from '@mui/material/styles/createTheme';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import 'dayjs/locale/en';

import reportWebVitals from './reportWebVitals';

import './App.css';
import './fonts.css';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

declare global {

  interface Window {
    INT_SITE_LOAD: boolean;
  }

  /**
   * @category Awayto React
   */
  interface IProps {
    children?: ReactNode;
    loading?: boolean;
    closeModal?(prop?: unknown): void;
    theme?: Theme;
  }
}

/**
 * 
 * Awayto bootstrapping function. Loads module structure into redux then bootstraps react. This is done to support the dynamic module structure in general, which includes reducers.
 * 
 * The dev could potentially load the site on any given page which may use any given reducer. So the reducers should be loaded as they will perform the functionality to return any data which may be necessary for the React.lazy component to get past Suspense.
 * 
 * In the future, we want to be more intelligent about how to pick which reducer to load, but it's not a major optimization.
 * 
 * @category Awayto
 * @param renderComponent {JSX.Element} The typical element structure you would give when calling React's `render()`
 */

import { store } from 'awayto/hooks';

const root = createRoot(document.getElementById('root') as Element);

if (window.location.pathname.startsWith('/app/ext/')) {
  (async function() {
    try {
      const Ext = (await import('./Ext')).default;
      root.render(
        <Provider store={store}>
          <BrowserRouter basename="/app/ext">
            <Ext />
          </BrowserRouter>
        </Provider>
      );
    } catch (err) {
      const error = err as Error
      console.log('error loading kiosk', error);
    }
  })().catch(console.error);
} else {
  (async function() {
    try {
      const AuthProvider = (await import('./modules/auth/AuthProvider')).default;
      root.render(
        <Provider store={store}>
          <BrowserRouter basename="/app">
            <AuthProvider />
          </BrowserRouter>
        </Provider>
      );
      reportWebVitals(console.log);
    } catch (error) {
      console.log('the final error', error)
    }
  })().catch(console.error);
}

