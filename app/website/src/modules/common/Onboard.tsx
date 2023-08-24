import React, { useCallback, useState, useEffect, Suspense } from 'react';

import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

import Icon from '../../img/kbt-icon.png';
import { useComponents, useUtil, sh } from 'awayto/hooks';
import keycloak from '../../keycloak';

export function Onboard(props: IProps): React.JSX.Element {

  const [joinGroup] = sh.useJoinGroupMutation();
  const [attachUser] = sh.useAttachUserMutation();

  const { setSnack } = useUtil();

  const { ManageGroupModal } = useComponents();

  const [groupCode, setGroupCode] = useState('');
  const [dialog, setDialog] = useState('');

  const joinGroupCb = useCallback(() => {
    if (!groupCode || !/^[a-zA-Z0-9]{8}$/.test(groupCode)) {
      setSnack({ snackType: 'warning', snackOn: 'Invalid group code.' });
    }

    async function go() {
      await joinGroup({ code: groupCode }).unwrap().catch(console.error);
      await attachUser({ code: groupCode }).unwrap().catch(console.error);
      keycloak.clearToken()
    }
    void go();
  }, [groupCode]);

  useEffect(() => {
    window.INT_SITE_LOAD = true;
  }, []);

  return <>

    <Dialog fullScreen open={dialog === 'create_group'} fullWidth maxWidth="sm">
      <Box sx={{ bgcolor: 'primary.dark' }}>
        <Grid container sx={{ placeContent: 'center', minHeight: '100vh', height: '100%' }}>
          <Grid item xs={6}>
            <Suspense>
              <ManageGroupModal
                {...props}
                closeModal={() => {
                  setDialog('');
                }}
              />
            </Suspense>
          </Grid>
        </Grid>
      </Box>
    </Dialog>

    <Box sx={{ bgcolor: 'primary.dark' }}>
      <Grid container sx={{ placeItems: { xs: 'start', sm: 'center' }, minHeight: '100vh', height: '100%' }}>

        <Grid p={4} item xs={12} sm={8} md={6}>
          <Grid container spacing={2}>
            <Grid item xs={4}>
              <img src={Icon} alt="kbt-icon" width="100%" />
            </Grid>

            <Grid item xs={8}>
              <Typography color="primary" variant="h5">Welcome to</Typography>
              <Typography color="primary" variant="h2" component="h1"><div>Awayto.</div><div>Exchange</div></Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography color="primary" variant="body1">It's a pleasure to welcome you! This application is designed to enhance the connection between an organization and its members. We provide a general platform, packed with functionality, which allows groups of all kinds to support different services related to their domain. Enjoy the app on both desktop and mobile browsers; customize your services to include lots of detail, or keep things simple; and even make use of a bit of artificial intelligence!</Typography>
            </Grid>

            <Grid item xs={12}>
              <Typography color="primary" variant="body1"><strong>AI:</strong> To get started, we need to know whether you're here to create a group for your organization, or join an existing group. From there, you'll be able to set up your services, create any necessary reporting forms and start scheduling appointments with your clients. You'll be meeting in one of our virtual sessions in no time!</Typography>
            </Grid>

          </Grid>
        </Grid>

        <Grid item xs={12} sm={4} md={6}>
          <Grid container p={4} spacing={4}>

            <Grid item xs={12}>
              <Typography color="primary" variant="h4" component="h2">Get Started!</Typography>

              <Typography color="primary" variant="body1">We're honored to be able to assist in your efforts, and ready to help you streamline your processes. Let's get started!</Typography>
            </Grid>

            <Grid item xs={12}>
              <Button fullWidth variant="contained" color="secondary" onClick={() => setDialog('create_group')}>Create a group</Button>
            </Grid>

            <Grid item xs={12}>
              <Grid container direction="row" alignItems="center" spacing={2}>
                <Grid item xs={1} />
                <Grid item flexGrow={1}>
                  <Divider />
                </Grid>
                <Grid item>
                  <Typography variant="button" color="primary">Or</Typography>
                </Grid>
                <Grid item flexGrow={1}>
                  <Divider />
                </Grid>
                <Grid item xs={1} />
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                value={groupCode}
                onChange={e => setGroupCode(e.target.value)}
                label="Group Code"
              />
            </Grid>

            <Grid item xs={12}>
              <Button fullWidth variant="contained" color="secondary" onClick={joinGroupCb}>Join a Group</Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  </>
}

export default Onboard;