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

import { IScheduleActionTypes, IServiceActionTypes, IUtilActionTypes, IScheduleContextActionTypes, ISchedule, IService, IScheduleTerm, IScheduleBracket, IFormActionTypes } from 'awayto';
import { useApi, useRedux, useComponents, useAct } from 'awayto-hooks';

const { GET_SCHEDULES, DELETE_SCHEDULE, POST_SCHEDULE } = IScheduleActionTypes;
const { GET_SERVICES } = IServiceActionTypes;
const { SET_SNACK } = IUtilActionTypes;
const { GET_FORMS } = IFormActionTypes;

const scheduleSchema = {
  name: '',
  overbook: false,
  term: {} as IScheduleTerm,
}

const termSchema = {
  scheduleContextId: '',
  scheduleContextName: '',
  duration: 0
}

const bracketSchema = {
  scheduleContextId: '',
  scheduleContextName: '',
  bracket: 0,
  multiplier: '1.00'
}

export function ScheduleHome(props: IProps): JSX.Element {
  const api = useApi();
  const act = useAct();
  const { SelectLookup } = useComponents();

  const [newSchedule, setNewSchedule] = useState<ISchedule>({ ...scheduleSchema, services: [], brackets: [] });
  const [newTerm, setNewTerm] = useState<IScheduleTerm>({ ...termSchema });
  const [newBracket, setNewBracket] = useState<IScheduleBracket>({ ...bracketSchema });

  const { services } = useRedux(state => state.service);
  const { schedules } = useRedux(state => state.schedule);
  const { scheduleContexts } = useRedux(state => state.forms);

  useEffect(() => {
    const [abort1, res] = api(GET_SCHEDULES, true);
    const [abort2] = api(GET_SERVICES, true);
    return () => {
      abort1();
      abort2();
    }
  }, []);

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
                {Object.values(schedules).map((schedule, i) => {
                  return <Box key={`schedule-chip${i + 1}new`} m={1}><Chip label={`${schedule.name}`} onDelete={() => {
                    void api(DELETE_SCHEDULE, true, { id: schedule.id });
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
                <Typography variant="h6">Schedule Context</Typography>
                <Typography variant="body2">The length of time the schedule will run over. This determines how brackets are divided. For example, if your schedule is 40 hours per week, here you can configure a <strong>1 week Schedule Context</strong>.</Typography>
                <SelectLookup lookupName="Schedule Context" lookups={scheduleContexts} lookupChange={(val: string) => {
                  const context = scheduleContexts?.find(c => c.id === val);
                  setNewTerm({ ...newTerm, scheduleContextName: context ? context.name : '', scheduleContextId: context ? context.id : '' })
                }} lookupValue={newTerm.scheduleContextId} refetchAction={GET_FORMS} {...props} />
              </Box>

              {newTerm.scheduleContextName && <Box mb={4}>
                <TextField fullWidth label={`# of ${newTerm.scheduleContextName}`} value={newTerm.duration || ''} onChange={e => setNewTerm({ ...newTerm, duration: Math.max(0, parseInt(e.target.value || '', 10)) })} type="number" />
              </Box>}

              <Box mb={4}>
                <Typography variant="h6">Overbook</Typography>
                <Typography variant="body2">Allow bookings after the last bracket within the term, using the last bracket's multiplier.</Typography>
                <Switch color="primary" value={newSchedule.overbook} onChange={e => setNewSchedule({ ...newSchedule, overbook: e.target.checked })} />
              </Box>

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
                    newSchedule.services.push(Object.values(services).filter(s => s.id === e.target.value)[0]);
                    setNewSchedule({ ...newSchedule, services: newSchedule.services })
                  }}
                >
                  {Object.values(services).filter(s => newSchedule.services.indexOf(s) < 0).map(service => <MenuItem key={`service-select${service.id as string}`} value={service.id}>{service.name}</MenuItem>)}

                </TextField>

                <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  {newSchedule.services.map((service, i) => {
                    return <Box key={`service-chip${i + 1}new`} m={1}><Chip label={`${service.name} Cost: ${service.cost || ''}`} onDelete={() => {
                      setNewSchedule({ ...newSchedule, services: newSchedule.services.filter((b, z) => i !== z) });
                    }} /></Box>
                  })}
                </Box>
              </Box>
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
                <Typography variant="h6">Bracket Duration</Typography>
                <Typography variant="body2">A block of time that will be available to schedule within the Schedule Context, as a sliding scale. For example:</Typography>
                <ul>
                  <li><Typography variant="caption">Alice's schedule has a <strong>1 week Schedule Context</strong>, and charges the same rate all week. <br /> - 1 bracket: <strong>40 hours, 1x multiplier</strong></Typography></li>
                  <li><Typography variant="caption">Rick's schedule also has a <strong>1 week Schedule Context</strong>, but charges more after the first 20 hours. <br /> - 2 brackets: <strong>20 hours, 1x multiplier</strong>, and <strong>20 hours, 2x multiplier</strong>.</Typography></li>
                </ul>
                <SelectLookup lookupName="Bracket Duration" lookups={scheduleContexts} lookupChange={(val: string) => {
                  const context = scheduleContexts?.find(c => c.id === val);
                  setNewBracket({ ...newBracket, scheduleContextName: context ? context.name : '', scheduleContextId: context ? context.id : '' })
                }} lookupValue={newBracket.scheduleContextId} refetchAction={GET_FORMS} {...props} />
              </Box>

              {newBracket.scheduleContextName && <Box mb={4}>
                <TextField fullWidth label={`# of ${newBracket.scheduleContextName}`} value={newBracket.bracket || ''} onChange={e => setNewBracket({ ...newBracket, bracket: parseInt(e.target.value || '', 10) })} type="number" />
              </Box>}

              <Box m={4} mb={-2}>
                <Typography variant="h6">Multiplier</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                  <Box>{newBracket.multiplier}x <span>&nbsp;</span> &nbsp;</Box>
                  <Slider value={parseFloat(newBracket.multiplier || '')} onChange={(e, val) => setNewBracket({ ...newBracket, multiplier: parseFloat(val.toString()).toFixed(2) })} step={.01} min={1} max={5} />
                </Box>
              </Box>
            </Grid>
          </Grid>

        </CardContent>
        <CardActionArea onClick={() => {
          if (newBracket.bracket && newBracket.scheduleContextId) {
            newSchedule.brackets.push(newBracket);
            setNewBracket({ ...bracketSchema });
          } else {
            void act(SET_SNACK, { snackOn: 'Provide number of intervals and a context.', snackType: 'info' });
          }
        }}>
          <Box mx={2} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography color="secondary" variant="button">Add to Schedule</Typography>
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
                    return <Box key={`bracket-chip${i + 1}new`} m={1}><Chip label={`#${i + 1} ${bracket.bracket || ''} ${bracket.scheduleContextName} (${bracket.multiplier}x)`} onDelete={() => {
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
          const { name, services, brackets } = newSchedule;
          if (name && services.length && newTerm.scheduleContextName && newTerm.duration && brackets.length) {
            newSchedule.term = newTerm;

            const [,res] = api(POST_SCHEDULE, true, { ...newSchedule })
            res?.then(() => {
              act(SET_SNACK, { snackOn: 'Successfully added ' + name, snackType: 'info' });
              setNewSchedule({ ...scheduleSchema, brackets: [], services: [] });
              setNewTerm({ ...termSchema });
            });
            
          } else {
            act(SET_SNACK, { snackOn: 'Provide a schedule name, service, term details and a bracket.', snackType: 'info' });
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