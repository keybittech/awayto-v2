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

  const onboardTop = useRef<HTMLDivElement>(null);

  const setStep = (panel: string | false) => {
    setExpanded(panel);
    onboardTop.current?.scrollIntoView({ behavior: 'auto', block: 'end', inline: 'nearest' })
  }

  const openTip = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    if (panel) {
      setStep(isExpanded ? panel : false);
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
                <Typography variant="subtitle1">
                  <p>Start by providing a unique name for your group. You can name it whatever you want, but we'll also generate a url-safe version alongside it.</p>
                  <p>Your group's description will enable various cusotmized functionality across the site, such as suggestions to complete forms, etc.</p>
                  <p>Restrict who can join your group by adding an email to the list of allowed domains. For example, site.com is the domain for the email user@site.com.</p>
                  <p>We'll use the example of a learning center to describe the next concepts.</p>
                </Typography>
              </AccordionWrap>

              <AccordionWrap {...CreateRoles}>
                <Typography variant="subtitle1">
                  <p>Roles allow access to different functionality on the site. Each user is assigned 1 role. You have the Admin role.</p>
                  <p>Some role name suggestions have been provided based on your group details. You can add them to your group by clicking on them. Otherwise, click the dropdown to add your own roles.</p>
                  <p>Once you've created some roles, set the default role as necessary. This role will automatically be assigned to new users who join your group. Normally you would choose the role which you plan to have the least amount of access.</p>
                  <p>For example, our learning center might have Student and Tutor roles. By default, everyone that joins is a Student. If a Tutor joins the group, the Admin can manually change their role in the user list.</p>
                </Typography>
              </AccordionWrap>

              <AccordionWrap {...CreateService}>
                <Typography variant="subtitle1">
                  <p>Services define the context of the appointments that happen within your group. You can add forms and tiers to distinguish the details of your service.</p>
                  <p>Forms can be used to enhance the information collected before and after an appointment. Click on a form dropdown to add a new form.</p>
                  <p>Each service should have at least 1 tier. The concept of the tiers is up to you, but it essentially allows for the distinction of level of service.</p>
                  <p>For example, our learning center creates a service called Writing Tutoring, which has a single tier, General. The General tier has a few features: Feedback, Grammar Help, Brainstorming. Forms are used to get details about the student's paper and then ask how the appointment went afterwards.</p>
                </Typography>
              </AccordionWrap>

              <AccordionWrap {...CreateSchedule}>
                <Typography variant="subtitle1">
                  <p>Finally we create a master schedule, which your users will use to create their own schedules. Start by providing basic details about the schedule and when it should be active.</p>
                  <p>Some premade options are available to select common defaults. Try selecting a default and adjusting it to your exact specifications.</p>
                  <p>For example, at our learning center, students and tutors meet in 30 minute sessions. Tutors work on an hours per week basis. So we create a schedule with a week duration, an hour bracket duration, and a booking slot of 30 minutes.</p>
                </Typography>
              </AccordionWrap>
            </Grid>

          </Grid>
        </Grid>

        <Grid item xs={12} sm={4} md={6}>
          <Suspense>

            <Grid container sx={{ p:4, bgcolor: 'secondary.main', placeContent: 'center', height: '100vh' }}>
              <Grid item xs={12} sx={{ maxHeight: '80vh', overflowY: 'scroll' }}>
                <Box ref={onboardTop} />
                {expanded === 'create_group' ? <ManageGroupModal
                  {...props}
                  editGroup={group}
                  closeModal={(newGroup: IGroup) => {
                    console.log(newGroup);
                    setGroup(newGroup);
                    setStep('create_roles');
                  }}
                /> :
                expanded === 'create_roles' ? <ManageGroupRolesModal
                  {...props}
                  editGroup={group}
                  closeModal={({ roles, defaultRoleId }: IGroup) => {
                    setGroup({ ...group, roles, defaultRoleId });
                    setStep('create_service');
                    console.log({ groupMOD: { ...group, roles, defaultRoleId } })
                  }}
                />:
                expanded === 'create_service' ? <NewManageServiceModal
                  {...props}
                  editGroup={group}
                  editService={service}
                  closeModal={(service: IService) => {
                    setService(service);
                    setStep('create_schedule');
                    console.log({ serviceMOD: service })
                  }}
                /> :
                expanded === 'create_schedule' ? <ManageSchedulesModal
                  {...props}
                  editGroup={group}
                  closeModal={(editSchedule: ISchedule) => {
                    setSchedule(editSchedule);
                    setStep('');
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