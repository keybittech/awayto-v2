import React from 'react';

import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardActionArea from '@mui/material/CardActionArea';
import Dialog from '@mui/material/Dialog';

import { useAppSelector, useUtil, getUtilRegisteredAction } from 'awayto/hooks';
import { CardHeader } from '@mui/material';

export function ConfirmAction(): JSX.Element {

  const { closeConfirm } = useUtil();
  const util = useAppSelector(state => state.util);

  return <>
    {util && (
      <Dialog open={!!util.isConfirming} fullWidth={true} maxWidth="sm">
        <Card>
          <CardHeader title="Confirm Action" subheader={`Action: ${util.confirmEffect}`} />
          <Grid container sx={{ minHeight: '25vh' }}>
            <Grid item xs={util.confirmSideEffect ? 6 : 12}>
              <CardActionArea sx={{ height: '100%', padding: '50px' }} onClick={() => {
                async function go() {
                  await getUtilRegisteredAction(util.confirmActionId as string)(true);
                  closeConfirm({});
                }
                void go();
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

              <CardActionArea sx={{ height: '100%', padding: '50px' }} onClick={() => {
                async function go() {
                  await getUtilRegisteredAction(util.confirmActionId as string)(false);
                  closeConfirm({});
                }
                void go();
              }}>
                <Grid container textAlign="center" justifyContent="center">
                  <Typography variant="button" fontSize={16}>{util.confirmSideEffect.rejectionAction}</Typography>
                  <Typography variant="caption">Click here to: {util.confirmSideEffect.rejectionEffect}</Typography>
                </Grid>
              </CardActionArea>
            </Grid>}
          </Grid>
          <CardActions>
            <Button onClick={() => { closeConfirm({}); }}>Cancel</Button>
          </CardActions>
        </Card>
      </Dialog>
    )}
  </>
}

export default ConfirmAction;