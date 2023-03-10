import React, { useMemo, useState, useRef, useCallback, Suspense, useEffect } from "react";

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';

import { getRelativeDuration, IGroup, ISchedule, IScheduleBracket, ITimeUnitNames, IUtilActionTypes, timeUnitOrder } from "awayto";
import { useApi, useAct, useComponents, useRedux } from 'awayto-hooks';

import { scheduleSchema } from "./ScheduleHome";
import { ManageScheduleBracketsActions } from "./ManageScheduleBrackets";

const { SET_SNACK } = IUtilActionTypes;

const bracketSchema = {
  duration: 1,
  automatic: false,
  multiplier: '1.00'
};

declare global {
  interface IProps {
    group?: IGroup;
    editSchedule?: ISchedule;
  }
}

export function ManageScheduleBracketsModal({ group, editSchedule, closeModal, ...props }: IProps): JSX.Element {

  const { getScheduleByIdAction, groupServices, groupSchedules, getGroupServicesAction, getGroupSchedulesAction, postScheduleAction, postScheduleBracketsAction, postGroupUserScheduleAction } = props as IProps & Required<ManageScheduleBracketsActions>;

  const api = useApi();
  const act = useAct();
  const { ScheduleDisplay } = useComponents();

  const scheduleParent = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(1);
  const [schedule, setSchedule] = useState({ ...scheduleSchema, brackets: {} } as ISchedule);
  const [bracket, setBracket] = useState({ ...bracketSchema, services: {}, slots: {} } as IScheduleBracket);
  const { timeUnits } = useRedux(state => state.lookup);

  const attachScheduleUnits = useCallback((sched: ISchedule) => {
    sched.scheduleTimeUnitName = timeUnits.find(u => u.id === sched.scheduleTimeUnitId)?.name as ITimeUnitNames;
    sched.bracketTimeUnitName = timeUnits.find(u => u.id === sched.bracketTimeUnitId)?.name as ITimeUnitNames;
    sched.slotTimeUnitName = timeUnits.find(u => u.id === sched.slotTimeUnitId)?.name as ITimeUnitNames;
  }, [timeUnits]);

  useEffect(() => {
    if (groupSchedules) {
      if (editSchedule) {
        const [, res] = api(getScheduleByIdAction, { id: editSchedule.id }, { load: true });
        res?.then(scheduleRes => {
          const [sched] = scheduleRes as ISchedule[];
          if (sched) {
            if (!sched.brackets) sched.brackets = {};
            attachScheduleUnits(sched);
            setSchedule({ ...sched });
            if (Object.keys(sched.brackets).length) {
              setView(2);
            }
          }
        }).catch(console.warn);
      } else {
        for (const g in groupSchedules) {
          const sched = groupSchedules[g];
          attachScheduleUnits(sched);
          setSchedule({ ...sched, brackets: {} });
          break;
        }
      }
    }
  }, [editSchedule, groupSchedules]);

  useEffect(() => {
    if (!group?.name) return;
    const [abort1] = api(getGroupServicesAction, { groupName: group.name });
    const [abort2] = api(getGroupSchedulesAction, { groupName: group.name });
    return () => {
      abort1();
      abort2();
    }
  }, [group]);

  const scheduleBracketsValues = useMemo(() => Object.values(schedule.brackets), [schedule.brackets]);
  const bracketServicesValues = useMemo(() => Object.values(bracket.services), [bracket.services]);

  const remainingBracketTime = useMemo(() => {
    if (schedule.scheduleTimeUnitName) {
      // Complex time adjustment example - this gets the remaining time that can be scheduled based on the schedule context, which always selects its first child as the subcontext (Week > Day), multiply this by the schedule duration in that context (1 week is 7 days), then convert the result to whatever the bracket type is. So if the schedule is for 40 hours per week, the schedule duration is 1 week, which is 7 days. The bracket, in hours, gives 24 hrs per day * 7 days, resulting in 168 total hours. Finally, subtract the time used by selected slots in the schedule display.
      const scheduleUnitChildUnit = timeUnitOrder[timeUnitOrder.indexOf(schedule.scheduleTimeUnitName) - 1];
      const scheduleChildDuration = getRelativeDuration(1, schedule.scheduleTimeUnitName, scheduleUnitChildUnit); // 7
      const usedDuration = scheduleBracketsValues.reduce((m, d) => m + d.duration, 0);
      const totalDuration = getRelativeDuration(Math.floor(scheduleChildDuration), scheduleUnitChildUnit, schedule.bracketTimeUnitName);
      return Math.floor(totalDuration - usedDuration);
    }
    return 0;
  }, [schedule, scheduleBracketsValues]);

  const handleSubmit = useCallback(() => {
    if (schedule) {
      const { name, scheduleTimeUnitName } = schedule;
      if (name && scheduleTimeUnitName && scheduleBracketsValues.length) {
        const [, res] = !editSchedule ?
          api(postScheduleAction, schedule, { load: true }) :
          [undefined, new Promise<ISchedule[]>(res => res([schedule]))];
        res?.then(resSchedules => {
          const [sched] = resSchedules as ISchedule[];

          const newBrackets = scheduleBracketsValues.reduce(
            (m, { id, duration, automatic, multiplier, slots, services }) => {
              return {
                ...m,
                [id]: {
                  id,
                  duration,
                  automatic,
                  multiplier,
                  slots: Object.values(slots).reduce((m, { startTime }, i) => ({ ...m, [i] : { startTime } }), {}),
                  services: Object.values(services).reduce((m, { id }, i) => ({ ...m, [i] : { id } }), {})
                }
              }
            }, {}
          );

          const [, rex] = api(postScheduleBracketsAction, { scheduleId: sched.id, brackets: newBrackets })
          const [, rez] = !editSchedule ?
            api(postGroupUserScheduleAction, { groupName: group?.name, userScheduleId: sched.id, groupScheduleId: schedule.id }) :
            [undefined, new Promise(res => res(true))];
          void Promise.all([rex, rez]).then(() => {
            act(SET_SNACK, { snackOn: 'Successfully added ' + name, snackType: 'info' });
            if (closeModal) closeModal();
          }).catch(console.warn);
        });

      } else {
        act(SET_SNACK, { snackOn: 'A schedule should have a name, a duration, and at least 1 bracket.', snackType: 'info' });
      }
    }
  }, [group, schedule, scheduleBracketsValues]);

  return <>
    <DialogTitle>{!editSchedule?.id ? 'Create' : 'Manage'} Schedule Bracket</DialogTitle>
    <DialogContent>

      {1 === view ? <>
        <Box mt={2} />

        <Box mb={4}>
          <TextField
            select
            fullWidth
            disabled={!!editSchedule?.id}
            label="Group Schedules"
            helperText="Select a group schedule to add to."
            value={schedule.id}
            onChange={e => {
              if (!editSchedule) {
                const sched = groupSchedules[e.target.value];
                attachScheduleUnits(sched);
                setSchedule({ ...sched, brackets: {} });
              }
            }}
          >
            {Object.values(groupSchedules).map(s =>{
              return <MenuItem
                key={`schedule-select${s.id}`}
                value={s.id}
                sx={{ alignItems: 'baseline' }}
              >
                {s.name}&nbsp;&nbsp;&nbsp;
                <Typography variant="caption" fontSize={10}>Timezone: {s.timezone}</Typography>
              </MenuItem>
            })}
          </TextField>
        </Box>

        <Box mb={4}>
          <Typography variant="body1"></Typography>
          <TextField
            fullWidth
            type="number"
            helperText={`Number of ${schedule.bracketTimeUnitName}s for this schedule. (Remaining: ${remainingBracketTime})`}
            label={`# of ${schedule.bracketTimeUnitName}s`}
            value={bracket.duration || ''}
            onChange={e => setBracket({ ...bracket, duration: Math.min(Math.max(0, parseInt(e.target.value || '', 10)), remainingBracketTime) })}
          />
        </Box>

        <Box sx={{ display: 'none' }}>
          <Typography variant="h6">Multiplier</Typography>
          <Typography variant="body2">Affects the cost of all services in this bracket.</Typography>
          <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
            <Box>{bracket.multiplier}x <span>&nbsp;</span> &nbsp;</Box>
            <Slider value={parseFloat(bracket.multiplier || '')} onChange={(_, val) => setBracket({ ...bracket, multiplier: parseFloat(val.toString()).toFixed(2) })} step={.01} min={1} max={5} />
          </Box>
        </Box>

        <Box sx={{ display: 'none' }}>
          <Typography variant="h6">Automatic</Typography>
          <Typography variant="body2">Bracket will automatically accept new bookings.</Typography>
          <Switch color="primary" value={bracket.automatic} onChange={e => setBracket({ ...bracket, automatic: e.target.checked })} />
        </Box>

        <Box mb={4}>
          <TextField
            select
            fullWidth
            label="Services"
            helperText="Select the services available to be scheduled."
            value={''}
            onChange={e => {
              bracket.services[e.target.value] = groupServices[e.target.value];
              setBracket({ ...bracket, services: { ...bracket.services } })
            }}
          >
            {Object.values(groupServices).filter(s => !bracket.services[s.id]).map(service => <MenuItem key={`service-select${service.id}`} value={service.id}>{service.name}</MenuItem>)}
          </TextField>

          <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {bracketServicesValues.map((service, i) => {
              return <Box key={`service-chip${i + 1}new`} m={1}><Chip label={`${service.name} ${service.cost ? `Cost: ${service.cost}` : ''}`} onDelete={() => {
                delete bracket.services[service.id];
                setBracket({ ...bracket, services: { ...bracket.services } });
              }} /></Box>
            })}
          </Box>
        </Box>
      </> : <>
        <Suspense fallback={<CircularProgress />}>
          <ScheduleDisplay {...props} parentRef={scheduleParent} schedule={schedule} setSchedule={setSchedule} />
        </Suspense>
      </>}
    </DialogContent>
    <DialogActions>
      <Grid container justifyContent="space-between">
        <Button onClick={closeModal}>Cancel</Button>
        {1 === view ? <Grid item>
          {!!scheduleBracketsValues.length && <Button
            onClick={() => {
              setView(2);
              setBracket({ ...bracketSchema, services: {}, slots: {} } as IScheduleBracket);
            }}
          >
            Cancel Add
          </Button>}
          <Button
            disabled={!bracket.duration || !bracketServicesValues.length}
            onClick={() => {
              if (bracket.duration && Object.keys(bracket.services).length) {
                bracket.id = (new Date()).getTime().toString();
                bracket.scheduleId = schedule.id;
                schedule.brackets[bracket.id] = bracket;
                setSchedule({ ...schedule, brackets: { ...schedule.brackets } })
                setBracket({ ...bracketSchema, services: {}, slots: {} } as IScheduleBracket);
                setView(2);
              } else {
                void act(SET_SNACK, { snackOn: 'Provide a duration, and at least 1 service.', snackType: 'info' });
              }
            }}
          >
            Continue
          </Button>
        </Grid> : <Grid item>
          <Button onClick={() => { setView(1); }}>Add another</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </Grid>}
      </Grid>
    </DialogActions>
  </>
}

export default ManageScheduleBracketsModal;