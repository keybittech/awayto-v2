import React from 'react';

import Box from '@mui/material/Box';
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
import { CardHeader } from '@mui/material';

const { CLOSE_CONFIRM } = IUtilActionTypes;

export function ConfirmAction(): JSX.Element {

  const act = useAct();
  const util = useRedux(state => state.util);

  return <>
    {util && (
      <Dialog open={!!util.isConfirming} fullWidth={true} maxWidth="xs">
        <Card>
          <CardHeader title="Confirm Action" subheader={
            <>
              {util.confirmEffect && <Box my={2}>
                <Typography variant="button">Action:</Typography> <Typography fontSize={16} variant="caption">{util.confirmEffect}</Typography>
              </Box>}
              {util.confirmRequest && <Box my={2}>
                <Typography variant="body1">{util.confirmRequest}</Typography>
              </Box>}
            </>
          } />
          <Grid container>
            <Grid item xs={util.confirmRequest ? 6 : 12}>
              <CardActionArea onClick={async () => {
                await util.confirmAction(true);
                act(CLOSE_CONFIRM, { isConfirming: false });
              }}>
                <CardContent>
                  <Grid container direction="column" alignItems="center" justifyContent="space-evenly">
                    <Typography variant="subtitle1">{util.confirmRequest ? 'YES' : 'Click here to confirm approval.'}</Typography>
                  </Grid>
                </CardContent>
              </CardActionArea>
            </Grid>
            {util.confirmRequest && <Grid item xs={6}>

              <CardActionArea onClick={async () => {
                await util.confirmAction(false);
                act(CLOSE_CONFIRM, { isConfirming: false });
              }}>
                <CardContent>
                  <Grid container direction="column" alignItems="center" justifyContent="space-evenly">
                    <Typography variant="subtitle1">NO</Typography>
                  </Grid>
                </CardContent>
              </CardActionArea>
            </Grid>}
          </Grid>
          <CardActions>
            <Button onClick={() => { act(CLOSE_CONFIRM, { isConfirming: false }) }}>Cancel</Button>
          </CardActions>
        </Card>
      </Dialog>
    )}
  </>
}

export default ConfirmAction;