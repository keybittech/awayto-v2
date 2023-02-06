import React, { useState, FormEvent } from 'react';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';

import { useRedux, useAct } from 'awayto-hooks';
import { IUtilActionTypes, ILoginActionTypes } from 'awayto';

const { FORCE_PASS_CHANGE_SUCCESS } = ILoginActionTypes;
const { SET_SNACK } = IUtilActionTypes;

export function ChangeNewPassword(): JSX.Element {
  const act = useAct();
  const login = useRedux(state => state.login);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const changePassword = (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 1 || passwordConfirm !== password || !login.challengeName || !login.session) {
      act(SET_SNACK, { snackOn: `Error while resetting password: Make sure the passwords are valid and match, or restart the password reset process.`, snackType: 'error' });
      return;
    }

    // let error = undefined;

    // Change to KeyCloak
    // const { error } = await cognitoSSRPChallengeResponse(login.challengeName, login.session, {
    //   USERNAME: login.username,
    //   NEW_PASSWORD: password
    // });

    // if (!error) {
    //   act(FORCE_PASS_CHANGE_SUCCESS, { challengeName: ''});
    //   act(SET_SNACK, { snackOn: 'Password reset! Please log in.', snackType: 'success' });
    //   return;
    // }

    // act(SET_SNACK, { snackOn: `Error while resetting password: ${error}`, snackType: 'error' });
  }

  return (
    <form style={{ height: '50vh' }} onSubmit={changePassword}>
      <Grid container direction="row" justifyContent="center" spacing={4}>
        <Grid item md={7} lg={4}>
          <Grid container direction="row" alignItems="center" spacing={4}>
            <Grid item xs={12}>
              <Typography>You must reset your password before logging in.</Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="New Password" helperText="Password must be at least 6 characters and have 1 uppercase, 1 lowercase, a special character (e.g. @^$!*), and a number." type="password" id="password" aria-describedby="password" value={password} onChange={e => setPassword(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Confirm Password" helperText="Must match the password." type="password" id="passwordConfirm" aria-describedby="passwordConfirm" error={passwordConfirm !== password} value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" color="primary">Change Password</Button>
            </Grid>
          </Grid>
        </Grid>
        
      </Grid>
    </form>
  )
}

export default ChangeNewPassword;