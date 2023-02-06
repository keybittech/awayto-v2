import React, { useState } from 'react';

import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import CardActions from '@mui/material/CardActions'
import Typography from '@mui/material/Typography'

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

import { IUserProfile, IUserProfileActionTypes } from 'awayto';
import { useAct } from 'awayto-hooks';
import { useNavigate } from 'react-router';

const { SIGNUP_USER, HAS_CODE } = IUserProfileActionTypes;

declare global {
  interface IProps {
    signUpButton?: boolean;
  }
}

export function SignUp(props: IProps): JSX.Element {
  const { signUpButton = false } = props;

  const navigate = useNavigate();
  const act = useAct();
  const [confirmPassword, setConfirmPassword] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [profile, setProfile] = useState<Partial<IUserProfile>>({
    firstName: '',
    lastName: '',
    email: '',
    username: ''
  });

  return <>
    {signUpButton ?
      <Button onClick={() => navigate('/signup')}>Sign Up</Button> :
      <>
        <form onSubmit={e => {
          e.preventDefault();
          if (!profile.username || !profile.email || confirmPassword.length < 8 || (password != confirmPassword)) return;

          // Sign up the user here
          // await cognitoPoolSignUp(profile.username, password, profile.email);

          profile.signedUp = true;

          act(SIGNUP_USER, profile as IUserProfile);
          act(HAS_CODE, { hasSignUpCode: true })
        }}>
          <Card>
            <CardContent>
              <Grid container spacing={4}>
                <Grid item xs={12}>
                  <Typography variant="h5">Signup</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Grid container direction="column" justifyContent="flex-start" alignItems="stretch" spacing={10}>
                    <Grid item>
                      <TextField fullWidth id="firstName" label="First Name" value={profile.firstName} name="firstName" onChange={e => setProfile({ ...profile, firstName: e.target.value })} />
                    </Grid>

                    <Grid item>
                      <TextField fullWidth id="lastName" label="Last Name" value={profile.lastName} name="lastName" onChange={e => setProfile({ ...profile, lastName: e.target.value })} />
                    </Grid>

                    <Grid item>
                      <TextField fullWidth id="email" label="Email" value={profile.email} name="email" onChange={e => setProfile({ ...profile, email: e.target.value })} />
                    </Grid>
                  </Grid>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Grid container direction="column" justifyContent="flex-start" alignItems="stretch" spacing={10}>
                    <Grid item>
                      <TextField fullWidth id="username" label="Username" value={profile.username} name="username" onChange={e => setProfile({ ...profile, username: e.target.value })} />
                    </Grid>
                    <Grid item>
                      <TextField fullWidth id="password" label="Password" value={password} name="password" onChange={e => setPassword(e.target.value)} helperText="Password must be at least 8 characters and have 1 uppercase, 1 lowercase, a special character (e.g. @^$!*), and a number." type={showPass ? 'text' : 'password'} InputProps={{
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
                      }} />
                    </Grid>
                    <Grid item>
                      <TextField fullWidth id="confirmPassword" label="Confirm Password" value={confirmPassword} name="confirmPassword" onChange={e => setConfirmPassword(e.target.value)} error={confirmPassword !== password} type="password" />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>

              <Grid item xs={12}>
                <Grid container justifyContent="space-between">
                  <Grid item>
                    <Button onClick={() => navigate('/')} color="primary">Back</Button>
                  </Grid>
                  <Grid item>
                    <Button onClick={() => act(HAS_CODE, { hasSignUpCode: true })} color="primary">I have a code</Button>
                    <Button type="submit" color="primary">Create</Button>
                  </Grid>
                </Grid>
              </Grid>
            </CardActions>
          </Card>



        </form>

      </>
    }
  </>
}

export default SignUp;