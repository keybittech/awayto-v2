import React, { useMemo, useState, useRef, useCallback, Suspense, useEffect } from "react";
import moment from 'moment';

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

import { IGroup, ISchedule, IScheduleBracket, ITimeUnitNames, IUtilActionTypes, timeUnitOrder } from "awayto";
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
    editSchedule?: ISchedule;
  }
}

export function ManageScheduleBracketsModal({ editSchedule, closeModal, ...props }: IProps): JSX.Element {

  const { getScheduleByIdAction, groupServices, groupSchedules, getGroupServicesAction, getGroupSchedulesAction, getScheduleBracketsAction, postScheduleAction, postScheduleBracketsAction, postScheduleParentAction } = props as IProps & Required<ManageScheduleBracketsActions>;

  const api = useApi();
  const act = useAct();
  const { ScheduleDisplay } = useComponents();

  const scheduleParent = useRef<HTMLDivElement>(null);
  const [view, setView] = useState(1);
  const [schedule, setSchedule] = useState({ ...scheduleSchema, brackets: {} } as ISchedule);
  const [bracket, setBracket] = useState({ ...bracketSchema, services: {}, slots: {} } as IScheduleBracket);
  const { groups } = useRedux(state => state.profile);
  const { timeUnits } = useRedux(state => state.forms);
  const [group, setGroup] = useState({ id: '', name: '' } as IGroup);


  const attachScheduleUnits = useCallback((sched: ISchedule) => {
    sched.scheduleTimeUnitName = timeUnits.find(u => u.id === sched.scheduleTimeUnitId)?.name as ITimeUnitNames;
    sched.bracketTimeUnitName = timeUnits.find(u => u.id === sched.bracketTimeUnitId)?.name as ITimeUnitNames;
    sched.slotTimeUnitName = timeUnits.find(u => u.id === sched.slotTimeUnitId)?.name as ITimeUnitNames;
  }, [groupSchedules]);

  useEffect(() => {
    if (groups && !editSchedule) {
      for (const g in groups) {
        setGroup(groups[g]);
        break;
      }
    }
    if (groupSchedules) {
      if (editSchedule) {
        const [, res] = api(getScheduleByIdAction, false, { id: editSchedule.id });
        res?.then(scheduleRes => {
          const [sched] = scheduleRes as ISchedule[];
          if (!sched.brackets) sched.brackets = {};
          attachScheduleUnits(sched);
          setSchedule({ ...sched });
        })
      } else {
        for (const g in groupSchedules) {
          const sched = groupSchedules[g];
          attachScheduleUnits(sched);
          setSchedule({ ...sched, brackets: {} });
          break;
        }
      }
    }
  }, [editSchedule, groups, groupSchedules]);

  useEffect(() => {
    if (!group?.name) return;
    const [abort1] = api(getGroupServicesAction, true, { groupName: group.name });
    const [abort2] = api(getGroupSchedulesAction, false, { groupName: group.name });
    const [abort3] = api(getScheduleBracketsAction);
    return () => {
      abort1();
      abort2();
      abort3();
    }
  }, [group]);

  const scheduleBracketsValues = useMemo(() => Object.values(schedule.brackets), [schedule.brackets]);
  const bracketServicesValues = useMemo(() => {
    if (Object.keys(bracket.services).length) setView(2);
    return Object.values(bracket.services);
  }, [bracket.services]);

  const remainingBracketTime = useMemo(() => {
    if (schedule.scheduleTimeUnitName) {
      // Complex time adjustment example - this gets the remaining time that can be scheduled based on the schedule context, which always selects its first child as the subcontext (Week > Day), multiply this by the schedule duration in that context (1 week is 7 days), then convert the result to whatever the bracket type is. So if the schedule is for 40 hours per week, the schedule duration is 1 week, which is 7 days. The bracket, in hours, gives 24 hrs per day * 7 days, resulting in 168 total hours. Finally, subtract the time used by selected slots in the schedule display.
      const scheduleUnitChildUnit = timeUnitOrder[timeUnitOrder.indexOf(schedule.scheduleTimeUnitName) - 1];
      const scheduleChildDuration = moment.duration({ [schedule.scheduleTimeUnitName]: 1 }).as(scheduleUnitChildUnit)
      const usedDuration = scheduleBracketsValues.reduce((m, d) => m + d.duration, 0);
      const totalDuration = moment.duration({ [scheduleUnitChildUnit]: Math.floor(scheduleChildDuration) }).as(schedule.bracketTimeUnitName as moment.unitOfTime.Base);
      return Math.floor(totalDuration - usedDuration)
    }
    return 0;
  }, [schedule, scheduleBracketsValues]);

  const handleSubmit = useCallback(() => {
    if (schedule) {
      const { name, duration, scheduleTimeUnitName, brackets } = schedule;
      if (name && duration && scheduleTimeUnitName && scheduleBracketsValues.length) {

        const [, res] = api(postScheduleAction, false, schedule);
        res?.then(resSchedules => {
          const [sched] = resSchedules as ISchedule[];

          const [, rex] = api(postScheduleBracketsAction, false, { scheduleId: sched.id, brackets })
          const [, rez] = api(postScheduleParentAction, false, { scheduleId: sched.id, parentUuid: schedule.id });
          void Promise.all([rex, rez]).then(() => {
            act(SET_SNACK, { snackOn: 'Successfully added ' + name, snackType: 'info' });
            if (closeModal) closeModal();
          });
        })

      } else {
        act(SET_SNACK, { snackOn: 'A schedule should have a name, a duration, and at least 1 bracket.', snackType: 'info' });
      }
    }
  }, [schedule, scheduleBracketsValues]);

  return <>
    <DialogTitle>{!editSchedule?.id ? 'Create' : 'Manage'} Schedule Bracket</DialogTitle>
    <DialogContent>

      {1 === view ? <>
        <Box mt={2} />
        {!editSchedule && <Box mb={4}>
          <TextField
            select
            fullWidth
            value={group.id}
            label="Group"
            helperText="Select the group for this schedule."
            onChange={e => {
              if (groups) {
                setGroup(groups[e.target.value]);
              }
            }}
          >
            {Object.values(groups || {}).map(group => <MenuItem key={`group-select${group.id}`} value={group.id}>{group.name}</MenuItem>)}
          </TextField>
        </Box>}

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
            {Object.values(groupSchedules).map(s => <MenuItem key={`schedule-select${s.id}`} value={s.id}>{s.name}</MenuItem>)}
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