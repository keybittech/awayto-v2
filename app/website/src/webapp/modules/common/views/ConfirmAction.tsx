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
      <Dialog open={!!util.isConfirming} fullWidth={true} maxWidth="sm">
        <Card>
          <CardHeader title="Confirm Action" subheader={`Action: ${util.confirmEffect}`} />
          <Grid container sx={{ minHeight: '25vh' }}>
            <Grid item xs={util.confirmSideEffect ? 6 : 12}>
              <CardActionArea sx={{ height: '100%', padding: '50px' }} onClick={async () => {
                await util.confirmAction(true);
                act(CLOSE_CONFIRM, { isConfirming: false });
              }}>
                <Grid container textAlign="center" justifyContent="center">
                  <Grid item>
                    {util.confirmSideEffect && <Typography variant="button" fontSize={16}>{util.confirmSideEffect?.approvalAction}</Typography>}
                  </Grid>
                  <Grid item>
                    <Typography variant="caption">{util.confirmSideEffect?.approvalEffect ? 'Click here to: ' + util.confirmSideEffect.approvalEffect : 'Click here to confirm approval.'}</Typography>
                  </Grid>
                </Grid>
              </CardActionArea>
            </Grid>
            {util.confirmSideEffect && <Grid item xs={6}>

              <CardActionArea sx={{ height: '100%', padding: '50px' }} onClick={async () => {
                await util.confirmAction(false);
                act(CLOSE_CONFIRM, { isConfirming: false });
              }}>
                <Grid container textAlign="center" justifyContent="center">
                  <Typography variant="button" fontSize={16}>{util.confirmSideEffect.rejectionAction}</Typography>
                  <Typography variant="caption">Click here to: {util.confirmSideEffect.rejectionEffect}</Typography>
                </Grid>
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