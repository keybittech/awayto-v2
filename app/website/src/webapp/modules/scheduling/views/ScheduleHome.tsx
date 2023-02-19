import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
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
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import MenuItem from '@mui/material/MenuItem';

import { IScheduleActionTypes, IUtilActionTypes, ISchedule, IScheduleBracket, IGroupServiceActionTypes, IGroupScheduleActionTypes, IGroup, BookingModes, timeUnitOrder, TimeUnit, ITimeUnitNames, IService } from 'awayto';
import { useApi, useRedux, useComponents, useAct } from 'awayto-hooks';
import { Mark } from '@mui/base';
import moment from 'moment';

const { GET_GROUP_SERVICES } = IGroupServiceActionTypes;
const { GET_GROUP_SCHEDULES, POST_GROUP_SCHEDULE, DELETE_GROUP_SCHEDULE } = IGroupScheduleActionTypes;

const { DELETE_SCHEDULE, POST_SCHEDULE } = IScheduleActionTypes;
const { SET_SNACK } = IUtilActionTypes;

const scheduleSchema = {
  name: '',
  duration: 1,
  slotDuration: 1
};

const bracketSchema = {
  duration: 1,
  startTime: '',
  automatic: false,
  multiplier: '1.00'
};

export function ScheduleHome(props: IProps): JSX.Element {
  const api = useApi();
  const act = useAct();
  const { SelectLookup, ScheduleDisplay } = useComponents();

  const [newSchedule, setNewSchedule] = useState<ISchedule>({ ...scheduleSchema, brackets: [] });
  const [newBracket, setNewBracket] = useState<IScheduleBracket>({ ...bracketSchema, services: [], slots: [] });

  const { groups } = useRedux(state => state.profile);
  const { groupServices } = useRedux(state => state.groupService);
  const { groupSchedules } = useRedux(state => state.groupSchedule);
  const { timeUnits } = useRedux(state => state.forms);
  const [group, setGroup] = useState(groups.at(0) as unknown as IGroup);
  const [bookingMode, setBookingMode] = useState(BookingModes.FIRST_COME);
  const [needsSlots, setNeedsSlots] = useState(true);

  useEffect(() => {
    if (!group.name) return;
    const [abort1, res] = api(GET_GROUP_SERVICES, true, { groupName: group.name });
    const [abort2] = api(GET_GROUP_SCHEDULES, true, { groupName: group.name });
    res?.then(() => setNewSchedule({ ...newSchedule }));
    return () => {
      abort1();
      abort2();
    }
  }, [group]);

  const setDefault = useCallback((type: string) => {
    const weekId = timeUnits.find(s => s.name === TimeUnit.WEEK)?.id;
    const hourId = timeUnits.find(s => s.name === TimeUnit.HOUR)?.id;
    const dayId = timeUnits.find(s => s.name === TimeUnit.DAY)?.id;
    const minuteId = timeUnits.find(s => s.name === TimeUnit.MINUTE)?.id;
    const monthId = timeUnits.find(s => s.name === TimeUnit.MONTH)?.id;
    if ('40hoursweekly' === type) {
      setNewSchedule({
        ...newSchedule,
        duration: 1,
        scheduleTimeUnitId: weekId,
        scheduleTimeUnitName: TimeUnit.WEEK,
        bracketTimeUnitId: hourId,
        bracketTimeUnitName: TimeUnit.HOUR,
        slotTimeUnitId: minuteId,
        slotTimeUnitName: TimeUnit.MINUTE,
        slotDuration: 60
      });
      setNewBracket({ ...newBracket, services: Object.values(groupServices), duration: 40, automatic: true });
    } else if ('fulldayweekly') {
      setNewSchedule({
        ...newSchedule,
        duration: 1,
        scheduleTimeUnitId: weekId,
        scheduleTimeUnitName: TimeUnit.WEEK,
        bracketTimeUnitId: dayId,
        bracketTimeUnitName: TimeUnit.DAY,
        slotTimeUnitId: dayId,
        slotTimeUnitName: TimeUnit.DAY,
        slotDuration: 1      
      });
      setNewBracket({ ...newBracket, services: Object.values(groupServices), duration: 1, automatic: true });
    }
  }, [timeUnits, groupServices]);

  const slotDurationMarks = useMemo(() => {
    const { duration, scheduleTimeUnitName, bracketTimeUnitName, slotTimeUnitName } = newSchedule;
    const factors = [] as Mark[];
    if (!bracketTimeUnitName || !slotTimeUnitName || !scheduleTimeUnitName || !duration) return factors;
    // const subdivided = bracketTimeUnitName !== slotTimeUnitName;
    // const finalDuration = !subdivided ? 
    //   Math.round(moment.duration({ [scheduleTimeUnitName]: duration }).as(bracketTimeUnitName)) : 
    const finalDuration =  Math.round(moment.duration({ [bracketTimeUnitName]: 1 }).as(slotTimeUnitName as moment.unitOfTime.Base));
    for (let value = 1; value <= finalDuration; value++) {
      if (finalDuration % value === 0) {
        factors.push({ value, label: value });
      }
    }
    return factors;
  }, [newSchedule]);

  return <Grid container spacing={2}>

    <Grid item xs={12}>
      <Card>
        <CardHeader
          title="Schedule"
          action={
            group?.id && <TextField
              select
              value={group.id}
              label="Group"
              onChange={e => setGroup(Object.values(groups).filter(g => g.id === e.target.value)[0])}
            >
              {Object.values(groups).map(group => <MenuItem key={`group-select${group.id}`} value={group.id}>{group.name}</MenuItem>)}
            </TextField>
          }
        />
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
                <Typography variant="h6">Defaults</Typography>
                <Typography variant="body2">Use sensible defaults for the Schedule and first Bracket configuration.</Typography>
                <Button color="secondary" onClick={() => setDefault('40hoursweekly')}>40 hours weekly</Button>
                <Button color="secondary" onClick={() => setDefault('fulldayweekly')}>full day weekly</Button>
              </Box>

              <Box mb={4}>
                <Typography variant="h6">Schedule Duration</Typography>
                <Typography variant="body2">The length of time the schedule will run over. This determines the overall context of your schedule and how time will be divided and managed within. For example, a 40 hour per week schedule would require configuring a <strong>1 week Schedule Duration</strong>.</Typography>
                <SelectLookup lookupName="Schedule Duration" lookups={timeUnits.filter(sc => ![TimeUnit.MINUTE, TimeUnit.HOUR].includes(sc.name as TimeUnit) )} lookupChange={(val: string) => {
                  const { id, name } = timeUnits?.find(c => c.id === val) || {};
                  if (!id || !name) return;
                  setNewSchedule({ ...newSchedule, scheduleTimeUnitName: name, scheduleTimeUnitId: id, bracketTimeUnitId: timeUnits.find(s => s.name === timeUnitOrder[timeUnitOrder.indexOf(name)-1])?.id })
                }} lookupValue={newSchedule.scheduleTimeUnitId || ''} {...props} />
              </Box>

              {newSchedule.scheduleTimeUnitName && <Box mb={4}>
                <TextField fullWidth label={`# of ${newSchedule.scheduleTimeUnitName}s`} value={newSchedule.duration || ''} onChange={e => setNewSchedule({ ...newSchedule, duration: Math.min(Math.max(0, parseInt(e.target.value || '', 10)), 999) })} type="number" />
              </Box>}
              

              {newSchedule.scheduleTimeUnitName && <Box mb={4}>
                <Typography variant="h6">Bracket Duration Type</Typography>
                <Typography variant="body2">How to measure blocks of time within the Schedule Duration. For example, in a 40 hour per week situation, blocks of time are divided in <strong>hours</strong>. Multiple brackets can be used on a single schedule, and all of them share the same Bracket Duration Type.</Typography>
                <SelectLookup noEmptyValue lookupName="Type" lookups={timeUnits.filter(sc => sc.name !== newSchedule.scheduleTimeUnitName && timeUnitOrder.indexOf(sc.name) <= timeUnitOrder.indexOf(newSchedule.scheduleTimeUnitName as ITimeUnitNames))} lookupChange={(val: string) => {
                  const { name, id } = timeUnits?.find(c => c.id === val) || {};
                  if (!name || !id) return;
                  setNewSchedule({ ...newSchedule, bracketTimeUnitName: name, bracketTimeUnitId: id, slotTimeUnitName: name, slotTimeUnitId: id, slotDuration: 1 })
                }} lookupValue={newSchedule.bracketTimeUnitId || ''} {...props} />
              </Box>}

              

              {newSchedule.bracketTimeUnitId && newSchedule.scheduleTimeUnitName && <Box mb={4}>
                <Typography variant="h6">Booking Slot</Typography>
                <Typography variant="body2">The # of {newSchedule.slotTimeUnitName}s to deduct from the bracket upon accepting a booking. Alternatively, if you meet with clients, this is the length of time per session.</Typography>
                <SelectLookup noEmptyValue lookupName="Slot Division" lookups={timeUnits.filter(sc => [timeUnitOrder.indexOf(newSchedule.bracketTimeUnitName as ITimeUnitNames), Math.max(timeUnitOrder.indexOf(newSchedule.bracketTimeUnitName as ITimeUnitNames) - 1, 0)].includes(timeUnitOrder.indexOf(sc.name)))} lookupChange={(val: string) => {
                  const { name, id } = timeUnits?.find(c => c.id === val) || {};
                  if (!name || !id) return;
                  setNewSchedule({ ...newSchedule, slotTimeUnitName: name, slotTimeUnitId: id, slotDuration: 1 })
                }} lookupValue={newSchedule.slotTimeUnitId || ''} {...props} />

                <Box mt={2} sx={{ display: 'flex', alignItems: 'baseline' }}>
                  <Box>{newSchedule.slotDuration} <span>&nbsp;</span> &nbsp;</Box>
                  <Slider value={newSchedule.slotDuration} onChange={(e, val) => setNewSchedule({ ...newSchedule, slotDuration: parseFloat(val.toString()) })} step={null} marks={slotDurationMarks} max={Math.max(...slotDurationMarks.map(m => m.value))} />
                </Box>
              </Box>}
            </Grid>
          </Grid>

        </CardContent>
      </Card>
    </Grid>



    {newSchedule.slotTimeUnitId && <Grid item xs={12}>
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHeader title="Add Bracket" />
        <CardContent sx={{ padding: '0 15px' }}>
          <Grid container>
            <Grid item xs={12} md={6}>
              <Typography variant="body2">A bracket is block of time that will be divided up and available to schedule within the Schedule Duration, as a sliding scale. For example:</Typography>
              <ul>
                <li><Typography variant="caption">Alice works <strong>40 hours per week</strong>, meets with clients in <strong>30 minute slots</strong>, and charges a single rate. <br /> - <strong>40 hours, 30 minute booking slot, 1x multiplier</strong></Typography></li>
                <li><Typography variant="caption">Rick works <strong>10 days per month</strong>, but charges more after the first 7 days. <br /> - 2 brackets: <strong>7 days, 1x multiplier</strong>, and <strong>3 days, 2x multiplier</strong>.</Typography></li>
              </ul>

              {newSchedule.bracketTimeUnitName && newSchedule.scheduleTimeUnitName && <Box mb={4}>
                <Typography variant="body1">Number of {newSchedule.bracketTimeUnitName}s for this bracket. (Remaining: {moment.duration({ [newSchedule.scheduleTimeUnitName]: newSchedule.duration }).as(newSchedule.bracketTimeUnitName)-newSchedule.brackets.reduce((m, d) => m+d.duration, 0)})</Typography>
                <TextField fullWidth label={`# of ${newSchedule.bracketTimeUnitName}s`} value={newBracket.duration || ''} onChange={e => setNewBracket({ ...newBracket, duration: Math.min(Math.max(0, parseInt(e.target.value || '', 10)), moment.duration({ [newSchedule.scheduleTimeUnitName as ITimeUnitNames]: newSchedule.duration }).as(newSchedule.bracketTimeUnitName as moment.unitOfTime.Base)) })} type="number" />
              </Box>}

              <Box mb={2}>
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

              <Box>
                <Typography variant="h6">Multiplier</Typography>
                <Typography variant="body2">Affects the cost of all services in this bracket.</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                  <Box>{newBracket.multiplier}x <span>&nbsp;</span> &nbsp;</Box>
                  <Slider value={parseFloat(newBracket.multiplier || '')} onChange={(_, val) => setNewBracket({ ...newBracket, multiplier: parseFloat(val.toString()).toFixed(2) })} step={.01} min={1} max={5} />
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
          if (newBracket.duration && newBracket.services.length) {
            newBracket.id = (new Date()).getTime().toString();
            setNewSchedule({ ...newSchedule, brackets: [...newSchedule.brackets, newBracket] })            
            setNewBracket({ ...bracketSchema, services: [], slots: [] });
          } else {
            void act(SET_SNACK, { snackOn: 'Provide a duration, and at least 1 service.', snackType: 'info' });
          }
        }}>
          <Box mx={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography color="secondary" variant="button">Add Bracket to Schedule</Typography>
          </Box>
        </CardActionArea>
      </Card>
    </Grid>}

    {!!newSchedule.brackets.length && <>
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
                      return <Box key={`bracket-chip${i + 1}new`} m={1}><Chip label={`#${i + 1} ${bracket.duration} ${newSchedule.bracketTimeUnitName as ITimeUnitNames} (${bracket.multiplier}x)`} onDelete={() => {
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
            const { name, duration, scheduleTimeUnitName, brackets } = newSchedule;
            if (name && duration && scheduleTimeUnitName && brackets.length) {
              const [, res] = api(POST_SCHEDULE, true, { ...newSchedule, groupName: group.name })
              res?.then(schedules => {
                if (schedules) {
                  const [schedule] = schedules as ISchedule[];
                  const [, rez] = api(POST_GROUP_SCHEDULE, true, { scheduleId: schedule.id, groupName: group.name });
                  rez?.then(() => {
                    api(GET_GROUP_SCHEDULES, true, { groupName: group.name });
                    act(SET_SNACK, { snackOn: 'Successfully added ' + name, snackType: 'info' });
                    setNewSchedule({ ...scheduleSchema, brackets: [] });
                    setNewBracket({ ...bracketSchema, services: [], slots: [] });
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

    </>}

    
        
    {newSchedule.brackets.length && <Suspense>
      <ScheduleDisplay {...props} schedule={newSchedule} setSchedule={setNewSchedule} />
    </Suspense>}


  </Grid>
}

export default ScheduleHome;