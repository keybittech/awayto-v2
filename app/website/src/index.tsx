export default {};

import 'typeface-roboto';

import React, { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';

import { Theme } from '@mui/material/styles/createTheme';

import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

import 'dayjs/locale/en';

import { store } from 'awayto/hooks';

import reportWebVitals from './reportWebVitals';
import { initKeycloak } from './keycloak';

import './App.css';

import App from './App';

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.extend(timezone);

declare global {

  /**
   * @category Awayto React
   */
  interface IProps {
    children?: ReactNode;
    loading?: boolean;
    closeModal?(): void;
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
void initKeycloak.call({
  cb: function () {

    try {
      const root = createRoot(document.getElementById('root') as Element);
      root.render(
        <Provider store={store}>
            {/* <PersistGate persistor={persistor}> */}
              <BrowserRouter basename="/app">
                <App />
              </BrowserRouter>
            {/* </PersistGate> */}
          </Provider>
      )
      reportWebVitals(console.log);
    } catch (error) {
      console.log('the final error', error)
    }

  }
});