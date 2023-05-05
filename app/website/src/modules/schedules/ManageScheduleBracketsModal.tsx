import React, { useMemo, useState, useRef, useCallback, Suspense } from 'react';

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

import { deepClone, getRelativeDuration, IGroup, ISchedule, IScheduleBracket, timeUnitOrder } from 'awayto/core';
import { useComponents, sh, useUtil } from 'awayto/hooks';

import { scheduleSchema } from './ScheduleHome';
import { useTimeName } from 'awayto/hooks';

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

  if (!group?.name) return <></>;

  const { setSnack } = useUtil();

  const { data: groupServices, isSuccess: groupServicesLoaded } = sh.useGetGroupServicesQuery({ groupName: group.name });
  const { data: groupSchedules, isSuccess: groupSchedulesLoaded } = sh.useGetGroupSchedulesQuery({ groupName: group.name });

  const [schedule, setSchedule] = useState({ ...(groupSchedules?.length ? groupSchedules[0] : scheduleSchema), brackets: {} } as ISchedule);

  const { data: scheduleDetails, refetch: getScheduleById } = sh.useGetScheduleByIdQuery({ id: editSchedule?.id || '' }, { skip: !editSchedule });

  if (scheduleDetails && !Object.keys(schedule.brackets).length) {
    setSchedule(deepClone(scheduleDetails));
  }

  const scheduleTimeUnitName = useTimeName(schedule.scheduleTimeUnitId);
  const bracketTimeUnitName = useTimeName(schedule.bracketTimeUnitId);

  const firstLoad = useRef(true);
  const [viewStep, setViewStep] = useState(1);
  if (Object.keys(schedule.brackets).length && viewStep === 1 && firstLoad.current) {
    setViewStep(2);
  }

  firstLoad.current = false;

  const [postSchedule] = sh.usePostScheduleMutation();
  const [postScheduleBrackets] = sh.usePostScheduleBracketsMutation();
  const [postGroupUserSchedule] = sh.usePostGroupUserScheduleMutation();

  const { ScheduleDisplay } = useComponents();

  const scheduleParent = useRef<HTMLDivElement>(null);
  const [bracket, setBracket] = useState({ ...bracketSchema, services: {}, slots: {} } as IScheduleBracket);

  const scheduleBracketsValues = useMemo(() => Object.values(schedule.brackets || {}), [schedule.brackets]);
  const bracketServicesValues = useMemo(() => Object.values(bracket.services || {}), [bracket.services]);

  const remainingBracketTime = useMemo(() => {
    if (scheduleTimeUnitName && bracketTimeUnitName) {
      // Complex time adjustment example - this gets the remaining time that can be scheduled based on the schedule context, which always selects its first child as the subcontext (Week > Day), multiply this by the schedule duration in that context (1 week is 7 days), then convert the result to whatever the bracket type is. So if the schedule is for 40 hours per week, the schedule duration is 1 week, which is 7 days. The bracket, in hours, gives 24 hrs per day * 7 days, resulting in 168 total hours. Finally, subtract the time used by selected slots in the schedule display.
      const scheduleUnitChildUnit = timeUnitOrder[timeUnitOrder.indexOf(scheduleTimeUnitName) - 1];
      const scheduleChildDuration = getRelativeDuration(1, scheduleTimeUnitName, scheduleUnitChildUnit); // 7
      const usedDuration = scheduleBracketsValues.reduce((m, d) => m + d.duration, 0);
      const totalDuration = getRelativeDuration(Math.floor(scheduleChildDuration), scheduleUnitChildUnit, bracketTimeUnitName);
      return Math.floor(totalDuration - usedDuration);
    }
    return 0;
  }, [scheduleTimeUnitName, bracketTimeUnitName]);

  const handleSubmit = useCallback(() => {
    async function go() {
      if (schedule && group?.name && schedule.name && scheduleBracketsValues.length) {
        const userSchedule = { ...schedule };
        if (!editSchedule) {
          const newSchedule = await postSchedule({ schedule }).unwrap();
          userSchedule.id = newSchedule.id;
        }

        const newBrackets = scheduleBracketsValues.reduce<Record<string, IScheduleBracket>>(
          (m, { id, duration, automatic, multiplier, slots, services }) => ({
            ...m,
            [id]: {
              id,
              duration,
              automatic,
              multiplier,
              slots,
              services
            } as IScheduleBracket
          }), {}
        );

        await postScheduleBrackets({
          scheduleId: userSchedule.id,
          brackets: newBrackets
        }).catch(console.error);

        if (!editSchedule) {
          await postGroupUserSchedule({
            groupName: group.name,
            userScheduleId: userSchedule.id,
            groupScheduleId: schedule.id
          }).catch(console.error);
        } else {
          await getScheduleById().catch(console.error);
        }

        setSnack({ snackOn: 'Successfully added your schedule to group schedule: ' + schedule.name, snackType: 'info' });
        if (closeModal) closeModal(!editSchedule);
      } else {
        setSnack({ snackOn: 'A schedule should have a name, a duration, and at least 1 bracket.', snackType: 'info' });
      }
    }
    void go();
  }, [group, schedule, scheduleBracketsValues]);

  return <>
    <DialogTitle>{!editSchedule?.id ? 'Create' : 'Manage'} Schedule Bracket</DialogTitle>
    <DialogContent>

      {1 === viewStep ? <>
        <Box mt={2} />

        {groupSchedulesLoaded && <Box mb={4}>
          <TextField
            select
            fullWidth
            disabled={!!editSchedule?.id}
            label="Group Schedules"
            helperText="Select a group schedule to add to."
            value={schedule.id}
            onChange={e => {
              if (!editSchedule) {
                const sched = deepClone(groupSchedules?.find(gs => gs.id === e.target.value));
                if (sched) {
                  setSchedule({ ...sched, brackets: {} });
                }
              }
            }}
          >
            {groupSchedules?.map(s => {
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
        </Box>}

        <Box mb={4}>
          <Typography variant="body1"></Typography>
          <TextField
            fullWidth
            type="number"
            helperText={`Number of ${bracketTimeUnitName}s for this schedule. (Remaining: ${remainingBracketTime})`}
            label={`# of ${bracketTimeUnitName}s`}
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

        {groupServicesLoaded && <Box mb={4}>
          <TextField
            select
            fullWidth
            label="Services"
            helperText="Select the services available to be scheduled."
            value={''}
            onChange={e => {
              const serv = groupServices?.find(gs => gs.id === e.target.value);
              if (serv) {
                bracket.services[e.target.value] = serv;
                setBracket({ ...bracket, services: { ...bracket.services } });
              }
            }}
          >
            {groupServices?.filter(s => !Object.keys(bracket.services).includes(s.id)).map(service => <MenuItem key={`service-select${service.id}`} value={service.id}>{service.name}</MenuItem>)}
          </TextField>

          <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {bracketServicesValues.map((service, i) => {
              return <Box key={`service-chip${i + 1}new`} m={1}><Chip label={`${service.name} ${service.cost ? `Cost: ${service.cost}` : ''}`} onDelete={() => {
                delete bracket.services[service.id];
                setBracket({ ...bracket, services: { ...bracket.services } });
              }} /></Box>
            })}
          </Box>
        </Box>}
      </> : <>
        <Suspense fallback={<CircularProgress />}>
          <ScheduleDisplay {...props} parentRef={scheduleParent} schedule={schedule} setSchedule={setSchedule} />
        </Suspense>
      </>}
    </DialogContent>
    <DialogActions>
      <Grid container justifyContent="space-between">
        <Button onClick={() => closeModal && closeModal(false)}>Cancel</Button>
        {1 === viewStep ? <Grid item>
          {!!scheduleBracketsValues.length && <Button
            onClick={() => {
              setViewStep(2);
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
                setSchedule({ ...schedule, brackets: schedule.brackets })
                setBracket({ ...bracketSchema, services: {}, slots: {} } as IScheduleBracket);
                setViewStep(2);
              } else {
                void setSnack({ snackOn: 'Provide a duration, and at least 1 service.', snackType: 'info' });
              }
            }}
          >
            Continue
          </Button>
        </Grid> : <Grid item>
          <Button onClick={() => { setViewStep(1); }}>Add another</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </Grid>}
      </Grid>
    </DialogActions>
  </>
}

export default ManageScheduleBracketsModal;