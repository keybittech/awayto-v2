import React, { FormEvent, useState, useCallback } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import { ILoginActionTypes, IUtilActionTypes } from 'awayto';
import { useRedux, useAct, useComponents } from 'awayto-hooks';

const { RESET_PASSWORD, LOGIN_USER, AUTH_DENIAL } = ILoginActionTypes;
const { SET_SNACK, START_LOADING, STOP_LOADING } = IUtilActionTypes;

export function Login(props: IProps): JSX.Element {

  const { SignUp } = useComponents();

  const act = useAct();
  const login = useRedux(state => state.login);

  const [showPass, setShowPass] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const submitForm = useCallback((e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    act(START_LOADING, { isLoading: true });
    try {
      // Change to KeyCloak
      // const { ChallengeName, Session } = await cognitoSSRPLogin(username, password);
      // if (ChallengeName)
      //   act(RESET_PASSWORD, { username, challengeName: ChallengeName, session: Session });
      // else
      //   act(LOGIN_USER, { username, isLoggedIn: true });
    } catch (error) {
      const { message } = error as Error;
      act(SET_SNACK, { snackType: 'error', snackOn: `Error while submitting login form: ${message}` })
      act(AUTH_DENIAL, { error: message });
    } finally {
      act(STOP_LOADING, { isLoading: false });
    }
  }, [username, password]);
  
  return login ?
    <form onSubmit={submitForm}>
      {/* <Grid container spacing={4} style={{ marginTop: '100px' }}>
        <Grid item xs={12} md={3}>
          <Grid container direction="column" justifyContent="flex-start" alignItems="stretch" spacing={4}>
            <Grid item>
              <TextField
                fullWidth
                id="username"
                label="Username"
                value={username}
                name="username"
                onChange={e => setUsername(e.target.value)}
              />
            </Grid>

            <Grid item>
              <TextField
                fullWidth
                id="password"
                label="Password"
                value={password}
                name="password"
                onChange={e => setPassword(e.target.value)}
                type={showPass ? 'text' : 'password'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPass(!showPass)}
                      >
                        {showPass ? <Visibility /> : <VisibilityOff />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item>
              <Grid container justifyContent="space-between">
                <SignUp {...props} signUpButton />
                <Button type="submit" color="primary">Login</Button>
              </Grid>
            </Grid>
          </Grid>
          {login.error && <Typography color="error">{login.error}</Typography>}
        </Grid>
      </Grid> */}
    </form> :
    <></>
}

export default Login;