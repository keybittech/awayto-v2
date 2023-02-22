import React, { Suspense, useCallback, useRef, useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import CardHeader from '@mui/material/CardHeader';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import MenuItem from '@mui/material/MenuItem';

import { IScheduleActionTypes, IUtilActionTypes, ISchedule, IScheduleBracket, IGroupServiceActionTypes, IGroupScheduleActionTypes, IGroup, BookingModes, timeUnitOrder, TimeUnit, ITimeUnitNames, IService, ITimeUnit } from 'awayto';
import { useApi, useRedux, useComponents, useAct } from 'awayto-hooks';
import { Mark } from '@mui/base';
import moment from 'moment';

const { GET_GROUP_SERVICES } = IGroupServiceActionTypes;
const { GET_GROUP_SCHEDULES, POST_GROUP_SCHEDULE, DELETE_GROUP_SCHEDULE } = IGroupScheduleActionTypes;

const { DELETE_SCHEDULE, POST_SCEHDULE_BRACKETS } = IScheduleActionTypes;
const { SET_SNACK } = IUtilActionTypes;

const scheduleSchema = {
  id: '',
  name: '',
  duration: 1,
  slotDuration: 1
};

const bracketSchema = {
  duration: 1,
  automatic: false,
  multiplier: '1.00'
};

export function ScheduleHome(props: IProps): JSX.Element {
  const api = useApi();
  const act = useAct();
  const scheduleParent = useRef<HTMLDivElement>(null);

  const { ScheduleDisplay } = useComponents();
  const [schedule, setSchedule] = useState({ ...scheduleSchema, brackets: {} } as ISchedule);
  const [newBracket, setNewBracket] = useState({ ...bracketSchema, services: {}, slots: {} } as IScheduleBracket);
  
  const { timeUnits } = useRedux(state => state.forms);
  const { groups } = useRedux(state => state.profile);
  const { groupServices } = useRedux(state => state.groupService);
  const { groupSchedules } = useRedux(state => state.groupSchedule);
  const [group, setGroup] = useState<IGroup>();

  useEffect(() => {
    if (groups) {
      for (const g in groups) {
        setGroup(groups[g]);
        break;
      }
    }
    if (groupSchedules) {
      for (const g in groupSchedules) {
        setNewSchedule(g);
        break;
      }
    }
  }, [groups, groupSchedules]);

  useEffect(() => {
    if (!group?.name) return;
    const [abort1] = api(GET_GROUP_SERVICES, true, { groupName: group.name });
    const [abort2] = api(GET_GROUP_SCHEDULES, true, { groupName: group.name });
    return () => {
      abort1();
      abort2();
    }
  }, [group]);

  const setNewSchedule = useCallback((scheduleId: string) => {
    const sched = groupSchedules[scheduleId];
    sched.scheduleTimeUnitName = timeUnits.find(u => u.id === sched.scheduleTimeUnitId)?.name as ITimeUnitNames;
    sched.bracketTimeUnitName = timeUnits.find(u => u.id === sched.bracketTimeUnitId)?.name as ITimeUnitNames;
    sched.slotTimeUnitName = timeUnits.find(u => u.id === sched.slotTimeUnitId)?.name as ITimeUnitNames;
    setSchedule({ ...groupSchedules[scheduleId], brackets: {} });
  }, [groupSchedules])

  const scheduleBracketsValues = useMemo(() => Object.values(schedule.brackets), [schedule.brackets]);
  const bracketServicesValues = useMemo(() => Object.values(newBracket.services), [newBracket.services]);

  const remainingBracketTime = useMemo(() => {
    if (!schedule.bracketTimeUnitName) return 0;

    // Complex time adjustment example - this gets the remaining time that can be scheduled based on the schedule context, which always selects its first child as the subcontext (Week > Day), multiply this by the schedule duration in that context (1 week is 7 days), then convert the result to whatever the bracket type is. So if the schedule is for 40 hours per week, the schedule duration is 1 week, which is 7 days. The bracket, in hours, gives 24 hrs per day * 7 days, resulting in 168 total hours. Finally, subtract the time used by selected slots in the schedule display.
    const scheduleUnitChildUnit = timeUnitOrder[timeUnitOrder.indexOf(schedule.scheduleTimeUnitName) - 1];
    const scheduleChildDuration = moment.duration({ [schedule.scheduleTimeUnitName]: 1 }).as(scheduleUnitChildUnit)
    const usedDuration = scheduleBracketsValues.reduce((m, d) => m + d.duration, 0);
    const totalDuration = moment.duration({ [scheduleUnitChildUnit]: Math.floor(scheduleChildDuration) }).as(schedule.bracketTimeUnitName);
    return Math.floor(totalDuration - usedDuration)
  }, [schedule, scheduleBracketsValues]);

  return <Grid container spacing={2}>

    <Grid item xs={12}>
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHeader
          title="Create Schedule Bracket"
          subheader='A bracket determines when you will be available during a schedule. The schedule determines how long the bracket can be. '
          action={
            groups && group?.id && <TextField
              select
              value={group.id}
              label="Group"
              onChange={e => setGroup(groups[e.target.value])}
            >
              {Object.values(groups || {}).map(group => <MenuItem key={`group-select${group.id}`} value={group.id}>{group.name}</MenuItem>)}
            </TextField>
          }
        />
        <CardContent sx={{ padding: '0 15px' }}>
          <Grid container>
            <Grid item xs={12} md={6}>
              {/* <ul>
                <li><Typography variant="caption">Alice works <strong>40 hours per week</strong>, meets with clients in <strong>30 minute slots</strong>, and charges a single rate. <br /> - <strong>40 hours, 30 minute booking slot, 1x multiplier</strong></Typography></li>
                <li><Typography variant="caption">Rick works <strong>10 days per month</strong>, but charges more after the first 7 days. <br /> - 2 brackets: <strong>7 days, 1x multiplier</strong>, and <strong>3 days, 2x multiplier</strong>.</Typography></li>
              </ul> */}


              <Box mb={4}>
                <TextField
                  select
                  fullWidth
                  label="Schedules"
                  helperText="Select a schedule to add the bracket to."
                  value={schedule.id}
                  onChange={e => {
                    setNewSchedule(e.target.value);
                  }}
                >
                  {Object.values(groupSchedules).map(service => <MenuItem key={`schedule-select${schedule.id}`} value={schedule.id}>{schedule.name}</MenuItem>)}
                </TextField>
              </Box>

              <Box mb={4}>
                <Typography variant="body1"></Typography>
                <TextField
                  fullWidth
                  type="number"
                  helperText={`Number of ${schedule.bracketTimeUnitName}s for this bracket. (Remaining: ${remainingBracketTime})`}
                  label={`# of ${schedule.bracketTimeUnitName}s`}
                  value={newBracket.duration || ''}
                  onChange={e => setNewBracket({ ...newBracket, duration: Math.min(Math.max(0, parseInt(e.target.value || '', 10)), remainingBracketTime) })}
                />
              </Box>

              <Box mb={2}>
                <TextField
                  select
                  fullWidth
                  label="Services"
                  helperText="Select the services that will be available to schedule."
                  value={''}
                  onChange={e => {
                    newBracket.services[e.target.value] = groupServices[e.target.value];
                    setNewBracket({ ...newBracket, services: { ...newBracket.services } })
                  }}
                >
                  {Object.values(groupServices).filter(s => !newBracket.services[s.id]).map(service => <MenuItem key={`service-select${service.id}`} value={service.id}>{service.name}</MenuItem>)}
                </TextField>

                <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  {bracketServicesValues.map((service, i) => {
                    return <Box key={`service-chip${i + 1}new`} m={1}><Chip label={`${service.name} Cost: ${service.cost || ''}`} onDelete={() => {
                      delete newBracket.services[service.id];
                      setNewBracket({ ...newBracket, services: { ...newBracket.services } });
                    }} /></Box>
                  })}
                </Box>
              </Box>

              <Box sx={{ display: 'none' }}>
                <Typography variant="h6">Multiplier</Typography>
                <Typography variant="body2">Affects the cost of all services in this bracket.</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                  <Box>{newBracket.multiplier}x <span>&nbsp;</span> &nbsp;</Box>
                  <Slider value={parseFloat(newBracket.multiplier || '')} onChange={(_, val) => setNewBracket({ ...newBracket, multiplier: parseFloat(val.toString()).toFixed(2) })} step={.01} min={1} max={5} />
                </Box>
              </Box>

              <Box mb={4} sx={{ display: 'none' }}>
                <Typography variant="h6">Automatic</Typography>
                <Typography variant="body2">Bracket will automatically accept new bookings.</Typography>
                <Switch color="primary" value={newBracket.automatic} onChange={e => setNewBracket({ ...newBracket, automatic: e.target.checked })} />
              </Box>
            </Grid>
          </Grid>

        </CardContent>
        <CardActionArea onClick={() => {
          if (newBracket.duration && Object.keys(newBracket.services).length) {
            newBracket.id = (new Date()).getTime().toString();
            newBracket.scheduleId = schedule.id;
            schedule.brackets[newBracket.id] = newBracket;
            setSchedule({ ...schedule, brackets: { ...schedule.brackets } })
            setNewBracket({ ...bracketSchema, services: {}, slots: {} } as IScheduleBracket);
          } else {
            void act(SET_SNACK, { snackOn: 'Provide a duration, and at least 1 service.', snackType: 'info' });
          }
        }}>
          <Box mx={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography color="secondary" variant="button">Add Bracket to Schedule</Typography>
          </Box>
        </CardActionArea>
      </Card>
    </Grid>

    {!!scheduleBracketsValues.length && <>

      <Grid item xs={12}>
        <Suspense>
          <ScheduleDisplay {...props} parentRef={scheduleParent} schedule={schedule} setSchedule={setSchedule} />
        </Suspense>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardActionArea onClick={group && (() => {
            const { name, duration, scheduleTimeUnitName } = schedule;
            if (name && duration && scheduleTimeUnitName && scheduleBracketsValues.length) {
              const [, res] = api(POST_SCEHDULE_BRACKETS, false, { brackets: schedule.brackets })
              res?.then(() => {
                const [, rez] = api(POST_GROUP_SCHEDULE, false, { scheduleId: schedule.id, groupName: group.name });
                rez?.then(() => {
                  api(GET_GROUP_SCHEDULES, true, { groupName: group.name });
                  act(SET_SNACK, { snackOn: 'Successfully added ' + name, snackType: 'info' });
                  setNewSchedule(schedule.id);
                  setNewBracket({ ...bracketSchema, services: {}, slots: {} } as IScheduleBracket);
                });
              });

            } else {
              act(SET_SNACK, { snackOn: 'A schedule should have a name, a duration, and at least 1 bracket.', snackType: 'info' });
            }
          })}>
            <Box mx={2} sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography color="secondary" variant="button">Create Schedule</Typography>
            </Box>
          </CardActionArea>
        </Card>
      </Grid>

    </>}


  </Grid>
}

export default ScheduleHome;