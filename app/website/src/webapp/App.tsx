import Icon from './img/kbt-icon.png';

import React, { Suspense, useEffect, useState } from 'react';
import { Route, Redirect, withRouter, Switch, Link } from 'react-router-dom';
import { parse } from 'querystring';
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';
import { Skeleton } from '@material-ui/lab';
import MomentUtils from '@date-io/moment';
import keycloak from './keycloak';

import withStyles from '@material-ui/core/styles/withStyles';
import Drawer from '@material-ui/core/Drawer';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Snackbar from '@material-ui/core/Snackbar';
import Toolbar from '@material-ui/core/Toolbar';
import CircularProgress from '@material-ui/core/CircularProgress';
import Backdrop from '@material-ui/core/Backdrop';
import AppBar from '@material-ui/core/AppBar';

import { ReactKeycloakProvider, useKeycloak } from '@react-keycloak/web';

import { IUtilActionTypes, IUserProfileActionTypes } from 'awayto';
import { useRedux, useAct, useComponents, useApi } from 'awayto-hooks';

import './App.css';
import { ThemeProvider } from '@material-ui/styles';
import { CssBaseline } from '@material-ui/core';
import { themes, styles } from './style';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';

function Alert(props: AlertProps): JSX.Element {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

const { SET_SNACK } = IUtilActionTypes;
const { GET_USER_PROFILE_DETAILS, KC_LOGIN } = IUserProfileActionTypes;

const App = (props: IProps): JSX.Element => {

  const { classes, history } = props;
  
  const act = useAct();

  const [keycloakReady, setKeycloakReady] = useState(false);
  const { Sidebar, ConfirmAction, Home, Profile, Manage } = useComponents();
  const { snackOn, snackType, isLoading, loadingMessage, theme } = useRedux(state => state.util);

  const hideSnack = (): void => {
    act(SET_SNACK, { snackOn: '' });
  }

  return <>
    <ReactKeycloakProvider authClient={keycloak} initOptions={{ onLoad: 'login-required' }}
      onEvent={(event) => {
        if ('onReady' === event) {
          setKeycloakReady(true);
        }
      }}
    >
      {
        keycloakReady ? <MuiPickersUtilsProvider utils={MomentUtils}>
          <ThemeProvider theme={themes[theme || 'dark']}>
            <CssBaseline />

            {
              keycloak.authenticated ?
                <div className={classes.root}>
                  <AppBar position="fixed" className={classes.appBar}>
                    <Toolbar />
                  </AppBar>
                  <Suspense fallback={
                    <Drawer className={classes.drawer} variant="permanent" classes={{ paper: classes.drawerPaper }} >
                      <Grid container style={{ height: '100vh' }} alignContent="space-between">
                        <Grid item xs={12} style={{ marginTop: '20px' }}>
                          <Grid container justifyContent="center">
                            <img src={Icon} alt="kbt-icon" className={classes.logo} />
                          </Grid>
                          <Grid container style={{ padding: '10px' }}>
                            <Skeleton variant="text" width="100%" />
                            <Skeleton variant="text" width="100%" />
                            <Skeleton variant="text" width="100%" />
                          </Grid>
                        </Grid>
                      </Grid>
                    </Drawer>
                  }>
                    <Sidebar {...props} />
                  </Suspense>
                  <main className={classes.content}>
                    <div className={classes.toolbar} />
                    <Suspense fallback={
                      <Grid container direction="row">
                        <AppBar position="fixed" className={classes.appBar}>
                          <Toolbar />
                        </AppBar>
                        <Grid container spacing={4} style={{ padding: '20px 20px 40px' }}>
                          <Skeleton variant="text" width="100%" />
                          <Skeleton variant="rect" width="100%" height="150px" animation="pulse" />
                        </Grid>
                        <Grid container spacing={4} style={{ padding: '20px' }}>
                          <Skeleton variant="text" width="100%" />
                          <Skeleton variant="rect" width="100%" height="150px" animation="pulse" />
                        </Grid>
                      </Grid >
                    }>
                      <Switch>
                        <Route exact path="/home" render={() => <Home {...props} />} />
                        <Route exact path="/profile" render={() => <Profile {...props} />} />
                        <Route exact path="/manage/:component" render={({ match }) => <Manage {...props} view={match.params.component} />} />
                      </Switch>
                    </Suspense>
                  </main>
                </div> :
                <main>
                  <Grid container justifyContent="center">
                    <Grid item xs={10}>
                      <Typography className={classes.link} color="primary" component={Link} to="/">
                        <Grid container alignItems="center" direction="row">
                          <img src={Icon} alt="keybit tech logo" className={classes.appLogo} />
                          <Typography variant="h3">&nbsp;AWAYTO</Typography>
                        </Grid>
                      </Typography>
                    </Grid>
                  </Grid>
                  <Grid container className={classes.loginWrap} justifyContent="center" direction="row">
                    <Grid item xs={10} style={{ paddingBottom: '50px' }}>
                      <div>Could not authenticate. Contact your administrator.</div>
                    </Grid>
                  </Grid>
                </main>
            }

            {!!snackOn && <Snackbar open={!!snackOn} autoHideDuration={6000} onClose={hideSnack}>
              <Alert onClose={hideSnack} severity={snackType || "info"}>
                {snackOn}
              </Alert>
            </Snackbar>}

            <Suspense fallback="">
              <ConfirmAction {...props} />
            </Suspense>

            <Backdrop className={classes.backdrop} open={!!isLoading} >
              <Grid container direction="column" alignItems="center">
                <CircularProgress color="inherit" />
                {loadingMessage ?? ''}
              </Grid>
            </Backdrop>

          </ThemeProvider>
        </MuiPickersUtilsProvider> : <div />
      }
    </ReactKeycloakProvider>
  </>
}

export default withStyles(styles)(withRouter(App));
