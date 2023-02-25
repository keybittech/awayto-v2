import React, { useState } from "react";

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { IService, IUtilActionTypes } from "awayto";
import { useApi, useAct } from 'awayto-hooks';
import { useCallback } from "react";
import { ManageServicesActions } from "./ManageServices";

const { SET_SNACK } = IUtilActionTypes;

declare global {
  interface IProps {
    editService?: IService;
  }
}

export function ManageServiceModal ({ editService, closeModal, ...props }: IProps): JSX.Element {
  const { putServicesAction, postServicesAction } = props as IProps & Required<ManageServicesActions>;

  const api = useApi();
  const act = useAct();
  const [service, setService] = useState({
    name: '',
    ...editService
  } as IService);
  
  const handleSubmit = useCallback(() => {
    const { id, name } = service;

    if (!name) {
      act(SET_SNACK, {snackType: 'error', snackOn: 'Services must have a name.' });
      return;
    }

    const [, res] = api(id ? putServicesAction : postServicesAction, service, { load: true });
    
    res?.then(() => {
      if (closeModal)
        closeModal();
    });

  }, [service]);

  return <>
    <Card>
      <CardContent>
        <Typography variant="button">Manage service</Typography>
        <Grid container direction="row" spacing={2}>
          <Grid item xs={12}>
            <Grid container direction="column" spacing={4} justifyContent="space-evenly" >
              <Grid item>
                <Typography variant="h6">Service</Typography>
              </Grid>
              <Grid item>
                <TextField
                  fullWidth
                  autoFocus
                  id="name"
                  label="Name"
                  name="name"
                  value={service.name}
                  onKeyDown={e => {
                    if ('Enter' === e.key) {
                      handleSubmit();
                    }
                  }}
                  onChange={e => setService({ ...service, name: e.target.value })} />
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

export default ManageServiceModal;