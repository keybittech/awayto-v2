import React, { useState } from "react";

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

import { ISchedule, IUtilActionTypes } from "awayto";
import { useApi, useAct } from 'awayto-hooks';
import { useCallback } from "react";
import { ManageSchedulesActions } from "./ManageSchedules";

const { SET_SNACK } = IUtilActionTypes;

declare global {
  interface IProps {
    editSchedule?: ISchedule;
  }
}

export function ManageScheduleModal ({ editSchedule, closeModal, ...props }: IProps): JSX.Element {
  const { putSchedulesAction, postSchedulesAction } = props as IProps & Required<ManageSchedulesActions>;

  const api = useApi();
  const act = useAct();
  const [Schedule, setSchedule] = useState<Partial<ISchedule>>({
    name: '',
    ...editSchedule
  });
  
  const handleSubmit = useCallback(() => {
    const { id, name } = Schedule;

    if (!name) {
      act(SET_SNACK, {snackType: 'error', snackOn: 'Schedules must have a name.' });
      return;
    }

    const [, res] = api(id ? putSchedulesAction : postSchedulesAction, true, Schedule);
    
    res?.then(() => {
      if (closeModal)
        closeModal();
    });

  }, [Schedule]);

  return <>
    <Card>
      <CardContent>
        <Typography variant="button">Manage Schedule</Typography>
        <Grid container direction="row" spacing={2}>
          <Grid item xs={12}>
            <Grid container direction="column" spacing={4} justifyContent="space-evenly" >
              <Grid item>
                <Typography variant="h6">Schedule</Typography>
              </Grid>
              <Grid item>
                <TextField
                  fullWidth
                  autoFocus
                  id="name"
                  label="Name"
                  name="name"
                  value={Schedule.name}
                  onKeyDown={e => {
                    if ('Enter' === e.key) {
                      handleSubmit();
                    }
                  }}
                  onChange={e => setSchedule({ ...Schedule, name: e.target.value })} />
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

export default ManageScheduleModal;