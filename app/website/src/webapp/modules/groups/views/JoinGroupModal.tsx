import React, { useState, useCallback } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';

import { IGroupActionTypes, IUtilActionTypes } from 'awayto';
import { useAct, useApi } from 'awayto-hooks';
import { TextField } from '@mui/material';

const { SET_SNACK } = IUtilActionTypes;
const { GROUPS_JOIN } = IGroupActionTypes;

export function JoinGroupModal ({ closeModal }: IProps): JSX.Element {

  const api = useApi();
  const act = useAct();

  const [code, setCode] = useState('');

  const handleSubmit = useCallback(() => {
    if (!code) {
      act(SET_SNACK, { snackType: 'error', snackOn: 'Please provide at least 1 code.' });
      return;
    }

    api(GROUPS_JOIN, true, { code });

    if (closeModal)
      closeModal();

  }, [code]);

  return <>
    <Card>
      <CardContent>
        <Typography variant="button">Join a Group</Typography>
      </CardContent>
      <CardContent>
        <Grid container>
          <Grid item xs={12}>
            <Grid container>
              <Grid item xs={12}>
                <TextField
                  label="Code"
                  type="code"
                  placeholder="Type an code and press enter..."
                  fullWidth
                  value={code}
                  onChange={e => {
                    setCode(e.currentTarget.value)
                  }}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions>
        <Grid container justifyContent="flex-end">
          <Button onClick={closeModal}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </Grid>
      </CardActions>
    </Card>
  </>
}

export default JoinGroupModal;