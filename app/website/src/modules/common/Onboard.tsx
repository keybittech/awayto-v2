import React, { useCallback, useState, useEffect, Suspense, useRef } from 'react';

import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import SettingsIcon from '@mui/icons-material/Settings';

import Icon from '../../img/kbt-icon.png';
import { IGroup, ISchedule, IService } from 'awayto/core';
import { useComponents, useUtil, useAccordion, sh } from 'awayto/hooks';
import keycloak from '../../keycloak';

export function Onboard(props: IProps): React.JSX.Element {

  const { data: profile } = sh.useGetUserProfileDetailsQuery();
  const [joinGroup] = sh.useJoinGroupMutation();
  const [attachUser] = sh.useAttachUserMutation();

  const { setSnack } = useUtil();

  const { ManageGroupModal, ManageGroupRolesModal, NewManageServiceModal, ManageSchedulesModal, AccordionWrap } = useComponents();

  const [group, setGroup] = useState({} as IGroup);
  const [service, setService] = useState<IService>();
  const [schedule, setSchedule] = useState({} as ISchedule);

  const [groupCode, setGroupCode] = useState('');
  const [expanded, setExpanded] = useState<string | false>('create_group');

  const openTip = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    if (panel) {
      setExpanded(isExpanded ? panel : false);
    }
  };

  const stepAvatar = (name: string, num: number) => () => <Avatar sx={{ bgcolor: expanded === name ? 'secondary.main' : 'primary.contrastText', color: 'white' }}>{num}</Avatar> ;

  const CreateGroup = useAccordion('Create Group', false, expanded === 'create_group', openTip('create_group'), stepAvatar('create_group', 1));
  const CreateRoles = useAccordion('Create Roles', false, expanded === 'create_roles', openTip(group.name ? 'create_roles' : ''), stepAvatar('create_roles', 2));
  const CreateService = useAccordion('Create Service', false, expanded === 'create_service', openTip(group.defaultRoleId ? 'create_service' : ''), stepAvatar('create_service', 3));
  const CreateSchedule = useAccordion('Create Schedule', false, expanded === 'create_schedule', openTip(service?.name ? 'create_schedule' : ''), stepAvatar('create_schedule', 4));

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

  useEffect(() => {
    if (profile?.groups) {
      const gr = Object.values(profile?.groups)[0];
      if (gr) {
        setGroup(gr);
      }
    }
  }, [profile]);

  return <>

    {/* <Suspense>
      <Dialog fullScreen open={!!expanded} fullWidth maxWidth="sm">
        <Grid container sx={{ bgcolor: 'primary.dark', placeContent: 'center', height: '100vh' }}>
          <Grid item xs={6} sx={{ maxHeight: '80vh', overflowY: 'scroll' }}>
            {expanded === 'create_group' ? <ManageGroupModal
              {...props}
              closeModal={(editGroup: IGroup) => {
                console.log(editGroup);
                setGroup(editGroup);
                setExpanded('create_roles');
              }}
            >
              {createTip(
                'Describing your group enables functionality across the site, providing suggestions based on what your group does.',
                'Allowed Email Domains restrict who can join your group. For example, site.com is the domain for the email user@site.com.'
              )}
            </ManageGroupModal> :
              expanded === 'create_roles' ? <ManageGroupRolesModal
                {...props}
                editGroup={group}
                closeModal={({ roles, defaultRoleId }: IGroup) => {
                  setGroup({ ...group, roles, defaultRoleId });
                  setExpanded('create_schedule');
                  console.log({ groupMOD: { ...group, roles, defaultRoleId } })
                }}
              >
                {createTip(
                  'Click the "Group Roles" dropdown box and select "Add..." to add new roles. The underlined suggestions have been generated for you based on your group description. Click them to add.'
                )}
              </ManageGroupRolesModal> :
                expanded === 'create_schedule' ? <ManageSchedulesModal
                  {...props}
                  editGroup={group}
                  closeModal={(editSchedule: ISchedule) => {
                    setSchedule(editSchedule);
                    setExpanded('');
                    console.log({ scheduleMOD: editSchedule })
                  }}
                >
                  {createTip(
                    'Blah blah.'
                  )}
                </ManageSchedulesModal> : <></>}
          </Grid>
        </Grid>
      </Dialog>
    </Suspense> */}

    <Box sx={{ bgcolor: 'primary.main' }}>
      <Grid container sx={{ placeItems: { xs: 'start', sm: 'center' }, minHeight: '100vh', height: '100%' }}>

        <Grid item xs={12} sm={8} md={6} p={4}>
          <Grid container spacing={2}>
            {/* <Grid item xs={4}>
              <img src={Icon} alt="kbt-icon" width="100%" />
            </Grid> */}

            {/* <Grid item xs={8}>
              <Typography color="primary" variant="h5">Welcome to</Typography>
              <Typography color="primary" variant="h2" component="h1"><div>Awayto.</div><div>Exchange</div></Typography>
            </Grid> */}

            <Grid item xs={12}>

              <AccordionWrap {...CreateGroup}>
                <Typography variant="body1">Describing your group enables functionality across the site, providing suggestions based on what your group does.</Typography>
                <Typography variant="body1">Allowed Email Domains restrict who can join your group. For example, site.com is the domain for the email user@site.com.</Typography>
              </AccordionWrap>

              <AccordionWrap {...CreateRoles}>
                <Typography variant="body1">Click the "Group Roles" dropdown box and select "Add..." to add new roles. The underlined suggestions have been generated for you based on your group description. Click them to add.</Typography>
              </AccordionWrap>

              <AccordionWrap {...CreateService}>
                <Typography variant="body1"></Typography>    
              </AccordionWrap>

              <AccordionWrap {...CreateSchedule}>
                <Typography variant="body1"></Typography>
              </AccordionWrap>
            </Grid>

          </Grid>
        </Grid>

        <Grid item xs={12} sm={4} md={6}>
          <Suspense>

            <Grid container sx={{ p:4, bgcolor: 'secondary.main', placeContent: 'center', height: '100vh' }}>
              <Grid item xs={12} sx={{ maxHeight: '80vh', overflowY: 'scroll' }}>

                {expanded === 'create_group' ? <ManageGroupModal
                  {...props}
                  editGroup={group}
                  closeModal={(newGroup: IGroup) => {
                    console.log(newGroup);
                    setGroup(newGroup);
                    setExpanded('create_roles');
                  }}
                /> :
                expanded === 'create_roles' ? <ManageGroupRolesModal
                  {...props}
                  editGroup={group}
                  closeModal={({ roles, defaultRoleId }: IGroup) => {
                    setGroup({ ...group, roles, defaultRoleId });
                    setExpanded('create_service');
                    console.log({ groupMOD: { ...group, roles, defaultRoleId } })
                  }}
                />:
                expanded === 'create_service' ? <NewManageServiceModal 
                  {...props}
                  editGroup={group}
                  editService={service}
                  closeModal={(service: IService) => {
                    setService(service);
                    setExpanded('create_schedule');
                    console.log({ serviceMOD: service })
                  }}
                /> :
                expanded === 'create_schedule' ? <ManageSchedulesModal
                  {...props}
                  editGroup={group}
                  closeModal={(editSchedule: ISchedule) => {
                    setSchedule(editSchedule);
                    setExpanded('');
                    console.log({ scheduleMOD: editSchedule })
                  }}
                /> : <></>}

              </Grid>
            </Grid>

          </Suspense>

          {/* <Grid container p={4} spacing={4}>

            <Grid item xs={12}>
              <Button fullWidth variant="contained" color="secondary" onClick={() => setExpanded('create_group')}>Create a group</Button>


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
          </Grid> */}
        </Grid>
      </Grid>
    </Box>
  </>
}

export default Onboard;