import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardHeader from '@material-ui/core/CardHeader';
import TextField from '@material-ui/core/TextField';
import Switch from '@material-ui/core/Switch';
import Chip from '@material-ui/core/Chip';
import Slider from '@material-ui/core/Slider';
import MenuItem from '@material-ui/core/MenuItem';

import { IScheduleActionTypes, IServiceActionTypes, IUtilActionTypes, IScheduleContextActionTypes, ISchedule, IService, IScheduleTerm, IScheduleBracket, ILookup } from 'awayto';
import { useApi, useRedux, useComponents, useAct } from 'awayto-hooks';

const { GET_SCHEDULES, DELETE_SCHEDULE, POST_SCHEDULE } = IScheduleActionTypes;
const { GET_SERVICES } = IServiceActionTypes;
const { SET_SNACK } = IUtilActionTypes;
const { POST_SCHEDULE_CONTEXT, DELETE_SCHEDULE_CONTEXT } = IScheduleContextActionTypes;

const scheduleSchema = {
  name: '',
  overbook: false,
  services: [] as IService[],
  term: {} as IScheduleTerm,
  brackets: []
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

  const [newSchedule, setNewSchedule] = useState<ISchedule>({ ...scheduleSchema });
  const [newTerm, setNewTerm] = useState<IScheduleTerm>({ ...termSchema });
  const [newBracket, setNewBracket] = useState<IScheduleBracket>({ ...bracketSchema });

  const { services } = useRedux(state => state.services);
  const { schedules } = useRedux(state => state.schedules);
  const { scheduleContexts } = useRedux(state => state.forms);

  useEffect(() => {
    void api(GET_SCHEDULES, true).then(() => {
      void api(GET_SERVICES, true);
    });
  }, []);

  return <Grid container spacing={2}>

    <Grid item xs={12}>
      <Card>
        <CardHeader title="Schedule" />
        <CardContent>
          <Box mx={4}>
            <Typography variant="body1">A schedule allows your services to be billed at different intervals. You can have multiple available schedules, each with multiple cost brackets. Brackets define a final cost multiplier within the breakpoints you define.</Typography>
            <Typography variant="caption">For example, if your schedule term is 60 hours, and you create a bracket for 40 hours at 1x multiplier, that means the first 40 of 60 hours will be listed at its regular cost. If you added a second bracket for 20 hours at 2x multiplier, the remaining 20 hours of the schedule term would be listed at a 2x cost multiplier.</Typography>
            <Typography variant="h6">Current Schedules: <Typography style={{ verticalAlign: 'middle' }} variant="caption">{Object.values(schedules).map(({ id, name }, i) => <Chip key={`del_sched_${i}`} label={name} onDelete={() => {
              void api(DELETE_SCHEDULE, true, { id });
            }}></Chip>)}</Typography></Typography>
          </Box>
        </CardContent>
      </Card>
    </Grid>

    <Grid item xs={12} md={6}>
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHeader title="Create Schedule" />
        <CardContent>
          <Box m={4}>
            <TextField fullWidth label="Name" value={newSchedule.name} onChange={e => setNewSchedule({ ...newSchedule, name: e.target.value })} helperText="Ex: Spring 2022 Campaign, Q1 Offering" />
          </Box>

          <Box m={4}>
            <Typography variant="h6">Term <Typography variant="caption">A duration of time that the schedule will run over.</Typography></Typography>
            <SelectLookup lookupName="Interval Type" lookups={scheduleContexts} lookupChange={val => {
              const context = scheduleContexts?.find(c => c.name === val as string);
              setNewTerm({ ...newTerm, scheduleContextName: context ? context.name : '', scheduleContextId: context ? context.id : '' })  
            }} lookupValue={newTerm.scheduleContextName} createActionType={POST_SCHEDULE_CONTEXT} deleteActionType={DELETE_SCHEDULE_CONTEXT} {...props} />
          </Box>

          <Box m={4}>
            <TextField fullWidth label="Term Intervals" value={newTerm.duration} onChange={e => setNewTerm({ ...newTerm, duration: parseInt(e.target.value || '0') })} type="number" helperText="All brackets will be reset after the term interval has passed." />
          </Box>

          <Box m={4}>
            <Typography variant="h6">Overbook <Typography variant="caption">Allow bookings after the last bracket within the term, using the last bracket's multiplier.</Typography></Typography>
            <Switch color="primary" value={newSchedule.overbook} onChange={e => setNewSchedule({ ...newSchedule, overbook: e.target.checked })} />
          </Box>

          <Box m={4}>
            <Typography variant="h6">Services <Typography variant="caption">The order that services appear here is the order they will be shown during booking.</Typography></Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {newSchedule.services.map((service, i) => {
                return <Box key={`service-chip${i + 1}new`} m={1}><Chip label={`${service.name} Cost: ${service.cost}`} onDelete={() => {
                  setNewSchedule({ ...newSchedule, services: newSchedule.services.filter((b, z) => i !== z) });
                }} /></Box>
              })}
            </Box>
          </Box>

          <Box m={4}>
            <Typography variant="h6">Brackets <Typography variant="caption">The order that brackets appear here is the order they take effect.</Typography></Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              {newSchedule.brackets.map((bracket, i) => {
                return <Box key={`bracket-chip${i + 1}new`} m={1}><Chip label={`${bracket.bracket} ${bracket.scheduleContextName} (${bracket.multiplier}x)`} onDelete={() => {
                  setNewSchedule({ ...newSchedule, brackets: newSchedule.brackets?.filter((b, z) => i !== z) });
                }} /></Box>
              })}
            </Box>
          </Box>

        </CardContent>
        <CardActionArea onClick={() => {
          const { name, services, brackets } = newSchedule;
          if (name && services.length && newTerm.scheduleContextName && newTerm.duration && brackets.length) {
            newSchedule.term = newTerm;
            void api(POST_SCHEDULE, true, { ...newSchedule }).then(() => {
              void act(SET_SNACK, { snackOn: 'Successfully added ' + name, snackType: 'info' });
              setNewSchedule({ ...scheduleSchema, brackets: [], services: [] });
              setNewTerm({ ...termSchema });
            });
          } else {
            void act(SET_SNACK, { snackOn: 'Provide a schedule name, service, term details and a bracket.', snackType: 'info' });
          }
        }}>
          <Box mx={6} sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="button">Create</Typography>
          </Box>
        </CardActionArea>
      </Card>
    </Grid>



    <Grid item xs={12} md={6}>
      <Grid container spacing={2}>

        <Grid item xs={12}>
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <CardHeader title="Service" />
            <CardContent>
              <Box m={4}>
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
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card style={{ display: 'flex', flexDirection: 'column' }}>
            <CardHeader title="Bracket" />
            <CardContent>
              <Box m={4}>
                <Typography variant="h6">Term <Typography variant="caption">A duration of time that the bracket will be effective for.</Typography></Typography>
                <SelectLookup lookupName="Interval Type" lookups={scheduleContexts} lookupChange={val => {
                  const context = scheduleContexts?.find(c => c.name === val as string);
                  setNewBracket({ ...newBracket, scheduleContextName: context ? context.name : '', scheduleContextId: context ? context.id : ''  })
                }} lookupValue={newBracket.scheduleContextName} createActionType={POST_SCHEDULE_CONTEXT} deleteActionType={DELETE_SCHEDULE_CONTEXT} {...props} />
              </Box>

              <Box m={4}>
                <TextField fullWidth label="Bracket Intervals" value={newBracket.bracket} onChange={e => setNewBracket({ ...newBracket, bracket: parseInt(e.target.value || '0') })} type="number" />
              </Box>
              
              <Box m={4} mb={-2}>
                <Typography variant="h6">Multiplier</Typography>
                <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                  <Box>{newBracket.multiplier}x <span>&nbsp;</span> &nbsp;</Box>
                  <Slider value={parseFloat(newBracket.multiplier)} onChange={(e, val) => setNewBracket({ ...newBracket, multiplier: parseFloat(val.toString()).toFixed(2) })} step={.01} min={1} max={5} />
                </Box>
              </Box>

            </CardContent>
            <CardActionArea onClick={() => {
              if (newBracket.bracket && newBracket.scheduleContextId) {
                newSchedule.brackets.push(newBracket);
                setNewBracket({ ...bracketSchema });
              } else {
                void act(SET_SNACK, { snackOn: 'Provide number of intervals and a context.', snackType: 'info' });
              }
            }}>
              <Box mx={6} sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="button">Add to Schedule</Typography>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>

      </Grid>
    </Grid>


  </Grid>
}

export default ScheduleHome;