import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import CardHeader from '@mui/material/CardHeader';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Slider from '@mui/material/Slider';
import MenuItem from '@mui/material/MenuItem';

import { IScheduleActionTypes, IUtilActionTypes, ISchedule, IScheduleBracket, IGroupServiceActionTypes, IGroupScheduleActionTypes, IGroup, BookingModes } from 'awayto';
import { useApi, useRedux, useComponents, useAct } from 'awayto-hooks';

const { GET_GROUP_SERVICES } = IGroupServiceActionTypes;
const { GET_GROUP_SCHEDULES, POST_GROUP_SCHEDULE, DELETE_GROUP_SCHEDULE } = IGroupScheduleActionTypes;

const { DELETE_SCHEDULE, POST_SCHEDULE } = IScheduleActionTypes;
const { SET_SNACK } = IUtilActionTypes;

const scheduleSchema = {
  name: '',
  scheduleContextId: '',
  scheduleContextName: '',
  duration: 0
};

const bracketSchema = {
  scheduleContextId: '',
  scheduleContextName: '',
  automatic: false,
  bracketDuration: 0,
  multiplier: '1.00',
  bookingAllotment: 1,
  bookingMode: BookingModes.FIRST_COME
};

export function ScheduleHome(props: IProps): JSX.Element {
  const api = useApi();
  const act = useAct();
  const { SelectLookup } = useComponents();

  const [newSchedule, setNewSchedule] = useState<ISchedule>({ ...scheduleSchema, brackets: [] });
  const [newBracket, setNewBracket] = useState<IScheduleBracket>({ ...bracketSchema, services: [] });

  const { groups } = useRedux(state => state.profile);
  const { groupServices } = useRedux(state => state.groupService);
  const { groupSchedules } = useRedux(state => state.groupSchedule);
  const { scheduleContexts } = useRedux(state => state.forms);
  const [group, setGroup] = useState(groups.at(0) as unknown as IGroup);

  useEffect(() => {
    if (!group.name) return;
    const [abort1, res] = api(GET_GROUP_SERVICES, true, { groupName: group.name });
    const [abort2] = api(GET_GROUP_SCHEDULES, true, { groupName: group.name});
    res?.then(() => setNewSchedule({ ...newSchedule }));
    return () => {
      abort1();
      abort2();
    }
  }, [group]);

  return <Grid container spacing={2}>

    <Grid item xs={12}>
      <Card>
        <CardHeader title="Schedule" />
        <CardContent sx={{ padding: '0 15px' }}>
          <Grid container>
            <Grid item>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <Typography variant="body2">A schedule allows your services to be billed at different intervals. You can have multiple available schedules, each with multiple cost brackets. Brackets allow you to define a sliding scale for the cost of your services.</Typography>
                <Typography variant="h6">Current Schedules: </Typography>
                {Object.values(groupSchedules).map((schedule, i) => {
                  return <Box key={`schedule-chip${i + 1}new`} m={1}><Chip label={`${schedule.name}`} onDelete={() => {
                    const [, res] = api(DELETE_GROUP_SCHEDULE, true, { groupName: group.name, scheduleId: schedule.id });   
                    res?.then(() => {
                      api(DELETE_SCHEDULE, true, { id: schedule.id });
                    });
                  }} /></Box>
                })}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>

    {group?.id && <Grid item xs={12}>
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHeader title="Group" />
        <CardContent sx={{ padding: '0 15px' }}>
          <Grid container>
            <Grid item xs={12} md={6}>
              
              <TextField
                select
                fullWidth
                label="Groups"
                helperText="Select the group for this schedule."
                value={group.id}
                onChange={e => setGroup(Object.values(groups).filter(g => g.id === e.target.value)[0])}
              >
                {Object.values(groups).map(group => <MenuItem key={`group-select${group.id}`} value={group.id}>{group.name}</MenuItem>)}
              </TextField>

            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>}


    <Grid item xs={12}>
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHeader title="Create Schedule" />
        <CardContent sx={{ padding: '0 15px' }}>
          <Grid container>
            <Grid item xs={12} md={6}>
              <Box mb={4}>
                <TextField fullWidth label="Name" value={newSchedule.name} onChange={e => setNewSchedule({ ...newSchedule, name: e.target.value })} helperText="Ex: Spring 2022 Campaign, Q1 Offering" />
              </Box>

              <Box mb={4}>
                <Typography variant="h6">Schedule Duration</Typography>
                <Typography variant="body2">The length of time the schedule will run over. This determines how brackets are divided. For example, if your schedule is 40 hours per week, here you can configure a <strong>1 week Schedule Duration</strong>.</Typography>
                <SelectLookup lookupName="Schedule Duration" lookups={scheduleContexts} lookupChange={(val: string) => {
                  const context = scheduleContexts?.find(c => c.id === val);
                  setNewSchedule({ ...newSchedule, scheduleContextName: context ? context.name : '', scheduleContextId: context ? context.id : '' })
                }} lookupValue={newSchedule.scheduleContextId} {...props} />
              </Box>

              {newSchedule.scheduleContextName && <Box mb={4}>
                <TextField fullWidth label={`# of ${newSchedule.scheduleContextName}s`} value={newSchedule.duration || ''} onChange={e => setNewSchedule({ ...newSchedule, duration: Math.max(0, parseInt(e.target.value || '', 10)) })} type="number" />
              </Box>}
            </Grid>
          </Grid>

        </CardContent>
      </Card>
    </Grid>


    <Grid item xs={12}>
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHeader title="Add Bracket" />
        <CardContent sx={{ padding: '0 15px' }}>
          <Grid container>
            <Grid item xs={12} md={6}>
              

            <Box mb={4}>
                <Typography variant="h6">Services</Typography>
                <Typography variant="body2">Services will appear on the Booking screen in the order you add them.</Typography>

                <TextField
                  select
                  fullWidth
                  label="Services"
                  helperText="Select to add to schedule."
                  value={''}
                  onChange={e => {
                    newBracket.services.push(Object.values(groupServices).filter(s => s.id === e.target.value)[0]);
                    setNewBracket({ ...newBracket, services: newBracket.services })
                  }}
                >
                  {Object.values(groupServices).filter(s => newBracket.services.indexOf(s) < 0).map(service => <MenuItem key={`service-select${service.id as string}`} value={service.id}>{service.name}</MenuItem>)}
                </TextField>

                <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  {newBracket.services.map((service, i) => {
                    return <Box key={`service-chip${i + 1}new`} m={1}><Chip label={`${service.name} Cost: ${service.cost || ''}`} onDelete={() => {
                      setNewBracket({ ...newBracket, services: newBracket.services.filter((b, z) => i !== z) });
                    }} /></Box>
                  })}
                </Box>
              </Box>

              <Box mb={4}>
                <Typography variant="h6">Bracket Duration</Typography>
                <Typography variant="body2">A block of time that will be available to schedule within the Schedule Duration, as a sliding scale. For example:</Typography>
                <ul>
                  <li><Typography variant="caption">Alice's schedule has a <strong>1 week Schedule Duration</strong>, and charges the same rate all week. <br /> - 1 bracket: <strong>40 hours, 1x multiplier</strong></Typography></li>
                  <li><Typography variant="caption">Rick's schedule also has a <strong>1 week Schedule Duration</strong>, but charges more after the first 20 hours. <br /> - 2 brackets: <strong>20 hours, 1x multiplier</strong>, and <strong>20 hours, 2x multiplier</strong>.</Typography></li>
                </ul>
                <SelectLookup lookupName="Bracket Duration" lookups={scheduleContexts} lookupChange={(val: string) => {
                  const context = scheduleContexts?.find(c => c.id === val);
                  setNewBracket({ ...newBracket, scheduleContextName: context ? context.name : '', scheduleContextId: context ? context.id : '' })
                }} lookupValue={newBracket.scheduleContextId} {...props} />
              </Box>

              {newBracket.scheduleContextName && <Box mb={4}>
                <TextField fullWidth label={`# of ${newBracket.scheduleContextName}s`} value={newBracket.bracketDuration || ''} onChange={e => setNewBracket({ ...newBracket, bracketDuration: parseInt(e.target.value || '', 10) })} type="number" />
              </Box>}

              {newBracket.scheduleContextName && <Box m={4} mb={-2}>
                <Typography variant="h6">Booking Allotment</Typography>
                <Typography variant="body2">The # of {newBracket.scheduleContextName} to deduct from the schedule for each booking.</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                  <Box>{newBracket.multiplier} <span>&nbsp;</span> &nbsp;</Box>
                  <Slider value={parseFloat(newBracket.multiplier || '')} onChange={(e, val) => setNewBracket({ ...newBracket, multiplier: parseFloat(val.toString()).toFixed(2) })} step={.01} min={1} max={5} />
                </Box>
              </Box>}

              <Box m={4} mb={-2}>
                <Typography variant="h6">Multiplier</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                  <Box>{newBracket.multiplier}x <span>&nbsp;</span> &nbsp;</Box>
                  <Slider value={parseInt(newBracket.multiplier || '')} onChange={(e, val) => setNewBracket({ ...newBracket, multiplier: parseFloat(val.toString()).toFixed(2) })} step={.01} min={1} max={5} />
                </Box>
              </Box>
            
              <Box mb={4}>
                <Typography variant="h6">Automatic</Typography>
                <Typography variant="body2">Bracket will automatically accept new bookings.</Typography>
                <Switch color="primary" value={newBracket.automatic} onChange={e => setNewBracket({ ...newBracket, automatic: e.target.checked })} />
              </Box>
            </Grid>
          </Grid>

        </CardContent>
        <CardActionArea onClick={() => {
          if (newBracket.bracketDuration && newBracket.scheduleContextId && newBracket.services.length) {
            newSchedule.brackets.push(newBracket);
            setNewBracket({ ...bracketSchema, services: [] });
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


    <Grid item xs={12}>
      <Card>
        <CardContent sx={{ padding: '0 15px' }}>
          <Grid container>
            <Grid item xs={12} md={6}>

              <Box>
                <Typography variant="h6">Brackets</Typography>
                <Typography variant="body2">Brackets will be shown here and take effect in the order you add them.</Typography>
                {newSchedule.brackets.length > 0 && <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  {newSchedule.brackets.map((bracket, i) => {
                    return <Box key={`bracket-chip${i + 1}new`} m={1}><Chip label={`#${i + 1} ${bracket.bracketDuration || ''} ${bracket.scheduleContextName} (${bracket.multiplier}x)`} onDelete={() => {
                      setNewSchedule({ ...newSchedule, brackets: newSchedule.brackets?.filter((b, z) => i !== z) });
                    }} /></Box>
                  })}
                </Box>}
              </Box>

            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12}>
      <Card>
        <CardActionArea onClick={() => {
          const { name, duration, scheduleContextName, brackets } = newSchedule;
          if (name && duration && scheduleContextName && brackets.length) {
            const [, res] = api(POST_SCHEDULE, true, { ...newSchedule })
            res?.then(schedules => {
              if (schedules) {
                const [schedule] = schedules as ISchedule[];
                const [, rez] = api(POST_GROUP_SCHEDULE, true, { scheduleId: schedule.id, groupName: group.name });
                rez?.then(() => {
                  api(GET_GROUP_SCHEDULES, true, { groupName: group.name });
                  act(SET_SNACK, { snackOn: 'Successfully added ' + name, snackType: 'info' });
                  setNewSchedule({ ...scheduleSchema, brackets: [] });
                  setNewBracket({ ...bracketSchema, services: [] });
                });
              }
            });
            
          } else {
            act(SET_SNACK, { snackOn: 'A schedule should have a name, a duration, and at least 1 bracket.', snackType: 'info' });
          }
        }}>
          <Box mx={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography color="secondary" variant="button">Create Schedule</Typography>
          </Box>
        </CardActionArea>
      </Card>
    </Grid>





  </Grid>
}

export default ScheduleHome;