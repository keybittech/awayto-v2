import React, { useCallback, useEffect, useState } from 'react';

import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import Input from '@mui/material/Input';
import FormHelperText from '@mui/material/FormHelperText';
import Button from '@mui/material/Button';
import InputLabel from '@mui/material/InputLabel';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

import { IGroupUser, IUserProfile, passwordGen } from 'awayto/core';
import { sh } from 'awayto/hooks';

declare global {
  interface IProps {
    editUser?: IUserProfile;
  }
}

export function ManageUserModal({ editUser, closeModal }: IProps): React.JSX.Element {

  const { data: groupRoles } = sh.useGetGroupRolesQuery();

  const [putGroupUser] = sh.usePutGroupUserMutation();

  const [password, setPassword] = useState('');
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    roleId: '',
    roleName: '',
    ...editUser
  } as IGroupUser);
  
  const handlePassword = useCallback(({ target: { value } }: React.ChangeEvent<HTMLTextAreaElement>) => setPassword(value), [])
  const handleProfile = useCallback(({ target: { name, value } }: React.ChangeEvent<HTMLTextAreaElement>) => setProfile({ ...profile, [name]: value }), [profile])

  const handleSubmit = useCallback(() => {
    async function go() {
      if (editUser?.id) {
        const { id, roleId } = profile;
        const { name } = groupRoles?.find(gr => gr.id === roleId) || {};
        if (name) {
          await putGroupUser({ userId: id, roleId, roleName: name }).unwrap();
          if (closeModal)
            closeModal();
        }
      }
    }
    void go();
    // async function submitUser() {
    //   let user = profile as IUserProfile;
    //   const { id, sub } = user;

    //   const groupRoleKeys = Object.keys(userGroupRoles);

    //   if (!groupRoleKeys.length)
    //     return act(SET_SNACK, { snackType: 'error', snackOn: 'Group roles must be assigned.' });

    //   user.groups = groupRoleKeys // { "g1": [...], "g2": [...] } => ["g1", "g2"];
    //     .reduce((memo, key) => {
    //       if (userGroupRoles[key].length) { // [...].length
    //         const group = { ...groups?.find(g => g.name == key) } as IGroup; // Get a copy from repository
    //         if (group.roles) {
    //           group.roles = group.roles.filter(r => userGroupRoles[key].includes(r.name)) // Filter roles
    //           memo.push(group);
    //         }
    //       }
    //       return memo;
    //     }, [] as IGroup[]);

    //   // User Update - 3 Scenarios
    //   // User-Originated - A user signed up in the wild, created a cognito account, has not done anything to 
    //   //                  generate an application account, and now an admin is generating one
    //   // Admin-Originated - A user being created by an admin in the manage area
    //   // Admin-Updated - A user being updated by an admin in the manage area

    //   // If there's already a sub, PUT/manage/users will update the sub in cognito;
    //   // else we'll POST/manage/users/sub for a new sub
    //   user = await api(sub ? PUT_MANAGE_USERS : POST_MANAGE_USERS_SUB, true, sub ? user : { ...user, password }) as IUserProfile;

    //   // Add user to application db if needed no user.id
    //   if (!id)
    //     user = await api(sub ? POST_MANAGE_USERS_APP_ACCT : POST_MANAGE_USERS, true, user) as IUserProfile;

    //   if (closeModal)
    //     closeModal();
    // }

    // void submitUser();
  }, [profile, password]);

  const passwordGenerator = useCallback(() => {
    setPassword(passwordGen());
  }, []);

  return <>
    <Card>
      <CardHeader
        title={`Manage ${profile.email}`}
        subheader={`${profile.firstName} ${profile.lastName}`}
      />
      <CardContent>
        <Grid container direction="row" spacing={2} justifyContent="space-evenly">
          <Grid item xs={12}>
            <Grid container direction="column" spacing={4} justifyContent="space-evenly" >

              <Grid item>
                <TextField select fullWidth id="roleId" label="Role" value={profile.roleId} name="roleId" onChange={handleProfile}>
                  {groupRoles?.map(role => <MenuItem key={`${role.id}_user_profile_role_select`} value={role.id}>{role.name}</MenuItem>)}
                </TextField>
              </Grid>

              {!editUser && (
                <Grid item xs>
                  <Grid container direction="column" justifyContent="space-evenly" spacing={4}>
                    <Grid item xs={12}>
                      <Typography variant="h6">Account</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField fullWidth id="username" label="Username" value={profile.username} name="username" onChange={handleProfile} />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel htmlFor="password">Password</InputLabel>
                        <Input type="text" id="password" aria-describedby="password" value={password} onChange={handlePassword}
                          endAdornment={
                            <InputAdornment position="end">
                              <Button onClick={passwordGenerator} style={{ backgroundColor: 'transparent' }}>Generate</Button>
                            </InputAdornment>
                          }
                        />
                        <FormHelperText>Password must be at least 8 characters and contain 1 uppercase, lowercase, number, and special (e.g. @^$!*) character. The user must change this passowrd upon logging in for the first time.</FormHelperText>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions>

        <Grid container justifyContent="space-between">
          <Button onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit}>{profile.sub ? 'update' : 'create'}</Button>
        </Grid>
      </CardActions>
    </Card>
  </>
}

export default ManageUserModal;