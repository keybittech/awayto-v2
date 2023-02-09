import React, { useState } from "react";

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { IManageRolesActionTypes, IRole, IUtilActionTypes } from "awayto";
import { useApi, useAct } from 'awayto-hooks';
import { useCallback } from "react";
import { ManageRolesActions } from "./ManageRoles";

const { SET_SNACK } = IUtilActionTypes;

declare global {
  interface IProps {
    editRole?: IRole;
  }
}

export function ManageRoleModal ({ editRole, closeModal, ...props }: IProps): JSX.Element {
  const { putAction, postAction } = props as IProps & Required<ManageRolesActions>;

  const api = useApi();
  const act = useAct();
  const [role, setRole] = useState<Partial<IRole>>({
    name: '',
    ...editRole
  });
  
  const handleSubmit = useCallback(() => {
    const { id, name } = role;

    if (!name) {
      act(SET_SNACK, {snackType: 'error', snackOn: 'Groups must have a name.' });
      return;
    }

    void api(id ? putAction : postAction, true, role);
    
    if (closeModal)
      closeModal();
      
  }, [role]);

  return <>
    <Card>
      <CardContent>
        <Typography variant="button">Manage role</Typography>
      </CardContent>
      <CardContent>
        <Grid container direction="row" spacing={2}>
          <Grid item xs={12}>
            <Grid container direction="column" spacing={4} justifyContent="space-evenly" >
              <Grid item>
                <Typography variant="h6">Role</Typography>
              </Grid>
              <Grid item>
                <TextField fullWidth id="name" label="Name" value={role.name} name="name" onChange={e => setRole({ ...role, name: e.target.value })} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions>
        <Grid container justifyContent="space-between">
          <Button onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </Grid>
      </CardActions>
    </Card>
  </>
}

export default ManageRoleModal;