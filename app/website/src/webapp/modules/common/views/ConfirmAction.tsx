import React from 'react';

import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardActionArea from '@mui/material/CardActionArea';
import Dialog from '@mui/material/Dialog';

import { IUtilActionTypes } from 'awayto';
import { useRedux, useAct } from 'awayto-hooks';

const { CLOSE_CONFIRM } = IUtilActionTypes;

export function ConfirmAction (): JSX.Element {

  const act = useAct();
  const util = useRedux(state => state.util);

  return <>
    {util && (
      <Dialog open={!!util.isConfirming} fullWidth={true} maxWidth="xs">
        <Card>
          <CardContent>
            <Typography variant="button">Confirm Action</Typography>
          </CardContent>
          <CardActionArea onClick={async () => {
            if (util.action)
              await util.action();
            act(CLOSE_CONFIRM, { isConfirming: false });
          }}>
            <CardContent>
              <Grid container direction="column" alignItems="center" justifyContent="space-evenly">
                <Typography variant="h6" style={{ wordBreak: 'break-all' }}>{util.message}</Typography>
                <Typography variant="subtitle1">Click to confirm.</Typography>
              </Grid>
            </CardContent>
          </CardActionArea>
          <CardActions>
            <Button onClick={() => { act(CLOSE_CONFIRM, { isConfirming: false }) }}>Cancel</Button>
          </CardActions>
        </Card>
      </Dialog>
    )}
  </>
}

export default ConfirmAction;