import React, { useState, useCallback, useMemo, useEffect } from "react";

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Mark } from "@mui/base";

import { ISchedule, IUtilActionTypes, ITimeUnit, TimeUnit, timeUnitOrder, getRelativeDuration, IGroupSchedule, ITimeUnitNames } from "awayto/core";
import { useApi, useAct, useRedux, useComponents } from 'awayto/hooks';

import { scheduleSchema } from "./ScheduleHome";
import { ManageSchedulesActions } from "./ManageSchedules";
import { useParams } from "react-router";

const { SET_SNACK } = IUtilActionTypes;

declare global {
  interface IProps {
    editSchedule?: ISchedule;
  }
}

export function ManageScheduleModal({ editSchedule, closeModal, ...props }: IProps): JSX.Element {
  const { getGroupSchedulesAction, getGroupScheduleMasterByIdAction, putGroupSchedulesAction, postGroupSchedulesAction } = props as IProps & Required<ManageSchedulesActions>;

  const { groupName } = useParams();

  const api = useApi();
  const act = useAct();
  const { SelectLookup } = useComponents();
  const { timeUnits } = useRedux(state => state.lookup);
  const [schedule, setSchedule] = useState({ ...scheduleSchema, ...editSchedule } as ISchedule);

  const attachScheduleUnits = useCallback((sched: ISchedule): ISchedule => {
    sched.scheduleTimeUnitName = timeUnits.find(u => u.id === sched.scheduleTimeUnitId)?.name as ITimeUnitNames;
    sched.bracketTimeUnitName = timeUnits.find(u => u.id === sched.bracketTimeUnitId)?.name as ITimeUnitNames;
    sched.slotTimeUnitName = timeUnits.find(u => u.id === sched.slotTimeUnitId)?.name as ITimeUnitNames;
    return sched;
  }, [timeUnits]);

  const setDefault = useCallback((type: string) => {
    const weekId = timeUnits.find(s => s.name === TimeUnit.WEEK)?.id;
    const hourId = timeUnits.find(s => s.name === TimeUnit.HOUR)?.id;
    const dayId = timeUnits.find(s => s.name === TimeUnit.DAY)?.id;
    const minuteId = timeUnits.find(s => s.name === TimeUnit.MINUTE)?.id;
    const monthId = timeUnits.find(s => s.name === TimeUnit.MONTH)?.id;
    if ('40hoursweekly30minsessions' === type) {
      setSchedule(attachScheduleUnits({
        ...schedule,
        scheduleTimeUnitId: weekId as string,
        bracketTimeUnitId: hourId as string,
        slotTimeUnitId: minuteId as string,
        slotDuration: 30
      }));
    } else if ('dailybookingpermonth') {
      setSchedule(attachScheduleUnits({
        ...schedule,
        scheduleTimeUnitId: monthId as string,
        bracketTimeUnitId: weekId as string,
        slotTimeUnitId: dayId as string,
        slotDuration: 1
      }));
    }
  }, [timeUnits, schedule]);

  const slotDurationMarks = useMemo(() => {
    const { scheduleTimeUnitName, bracketTimeUnitName, slotTimeUnitName } = schedule;
    const factors = [] as Mark[];
    if (!bracketTimeUnitName || !slotTimeUnitName || !scheduleTimeUnitName) return factors;
    // const subdivided = bracketTimeUnitName !== slotTimeUnitName;
    // const finalDuration = !subdivided ? 
    //   Math.round(getRelativeDuration(duration, scheduleTimeUnitName, bracketTimeUnitName)) : 
    const finalDuration = Math.round(getRelativeDuration(1, bracketTimeUnitName, slotTimeUnitName));
    for (let value = 1; value <= finalDuration; value++) {
      if (finalDuration % value === 0) {
        factors.push({ value, label: value });
      }
    }
    return factors;
  }, [schedule]);

  const handleSubmit = useCallback(() => {

    const { id, name, startTime, endTime } = schedule;
    if (!id) {
      if (name && startTime) {
        schedule.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const [, res] = api(postGroupSchedulesAction, { ...schedule, groupName });
        res?.then(() => {
          api(getGroupSchedulesAction, { groupName });
          act(SET_SNACK, { snackOn: 'Successfully added ' + name + ' as a master schedule!', snackType: 'info' });
          if (closeModal)
            closeModal();
        }).catch(console.warn);
  
      } else {
        act(SET_SNACK, { snackOn: 'A schedule should have a name, a start time.', snackType: 'info' });
      }
    } else {
      const [, res] = api(putGroupSchedulesAction, { id, startTime, endTime, groupName });
      res?.then(() => {
        act(SET_SNACK, { snackOn: 'Schedule updated!', snackType: 'info' });
        if (closeModal)
          closeModal();
      }).catch(console.warn);
    }

  }, [schedule]);

  useEffect(() => {
    if (editSchedule) {
      const [abort, res] = api(getGroupScheduleMasterByIdAction, { groupName, scheduleId: editSchedule.id }, { load: true });
      res?.then(schedules => {
        const [sched] = schedules as IGroupSchedule[];
        attachScheduleUnits(sched);
        setSchedule({ ...sched });
      }).catch(console.warn);
      return () => abort();
    } else {
      setDefault('40hoursweekly30minsessions');
    }
  }, []);

  return <>
    <DialogTitle>{schedule.id ? 'Manage' : 'Create'} Schedule</DialogTitle>
    <DialogContent>
      <Box mt={2} />

      <Box mb={4}>
        <TextField
          fullWidth
          disabled={!!schedule.id}
          label="Name"
          helperText="Ex: Spring 2022 Campaign, Q1 Offering"
          value={schedule.name || ''}
          onChange={e => setSchedule({ ...schedule, name: e.target.value })}
        />
      </Box>

      <Box mb={4}>
        <Grid container spacing={2} direction="row">
          <Grid item xs={6}>
            
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={schedule.startTime || ''}
              helperText="Schedule is active after this date. Clear this date to deactivate the schedule. Deactivated schedules do not allow new bookings to be made."
              onChange={e => setSchedule({ ...schedule, startTime: e.target.value })}
              InputLabelProps={{
                shrink: true,
              }}
            />
            {/* <DesktopDatePicker
              label="Start Date"
              value={schedule.startTime ? schedule.startTime : null}
              onChange={e => {
                // if (e) {
                //   console.log({ schedule, e, str: e ? nativeJs(new Date(e.toString())) : null })
                //   setSchedule({ ...schedule, startTime: nativeJs(new Date(e.toString())).toString() })
                //   // setSchedule({ ...schedule, startTime: e ? e.format(DateTimeFormatter.ofPattern("yyyy-mm-dd")) : '' });
                // }
              }}
              renderInput={(params) => <TextField helperText="Bookings can be scheduled any time after this date. Removing this value and saving the schedule will deactivate it, preventing it from being seen during booking." {...params} />}
            /> */}
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="End Date"
              type="date"
              value={schedule.endTime || ''}
              helperText="Optional. No bookings will be allowed after this date."
              onChange={e => setSchedule({ ...schedule, endTime: e.target.value })}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>
      </Box>

      <Box mb={4}>
        {!schedule.id ? <>
          <Typography variant="body2">Use premade selections for this schedule.</Typography>
          <Button color="secondary" onClick={() => setDefault('40hoursweekly30minsessions')}>40 hours per week, 30 minute slot</Button>
          <Button color="secondary" onClick={() => setDefault('dailybookingpermonth')}>daily booking per month</Button>
        </> : <>
          <Alert color="info">Schedule template durations are read-only after creation.</Alert>
        </>}
      </Box>

      <Box mb={4}>
        <SelectLookup
          noEmptyValue
          disabled={!!schedule.id}
          lookupName="Schedule Duration"
          helperText="The length of time the schedule will run over. This determines the overall context of the schedule and how time will be divided and managed within. For example, a 40 hour per week schedule would require configuring a 1 week Schedule Duration."
          lookupValue={schedule.scheduleTimeUnitId}
          lookups={timeUnits.filter(sc => ![TimeUnit.MINUTE, TimeUnit.HOUR, TimeUnit.YEAR].includes(sc.name as TimeUnit))}
          lookupChange={(val: string) => {
            const { id, name } = timeUnits?.find(c => c.id === val) || {};
            if (!id || !name) return;
            setSchedule({ ...schedule, scheduleTimeUnitName: name, scheduleTimeUnitId: id, bracketTimeUnitId: timeUnits.find(s => s.name === timeUnitOrder[timeUnitOrder.indexOf(name) - 1])?.id as string })
          }}
          {...props}
        />
      </Box>

      {/* <Box mb={4}>
        <TextField
          fullWidth
          type="number"
          disabled={!!schedule.id}
          label={`# of ${schedule.scheduleTimeUnitName}s`}
          helperText="Provide a duration. After this duration, the schedule will reset, and all bookings will be available again."
          value={schedule.duration}
          onChange={e => {
            setSchedule({ ...schedule, duration: Math.min(Math.max(0, parseInt(e.target.value || '', 10)), 999) })
          }}
        />
      </Box> */}

      <Box mb={4}>
        <SelectLookup
          noEmptyValue
          disabled={!!schedule.id}
          lookupName="Bracket Duration Type"
          helperText="How to measure blocks of time within the Schedule Duration. For example, in a 40 hour per week situation, blocks of time are divided in hours. Multiple brackets can be used on a single schedule, and all of them share the same Bracket Duration Type."
          lookupValue={schedule.bracketTimeUnitId}
          lookups={timeUnits.filter(sc => sc.name !== schedule.scheduleTimeUnitName && timeUnitOrder.indexOf(sc.name) <= timeUnitOrder.indexOf(schedule.scheduleTimeUnitName))}
          lookupChange={(val: string) => {
            const { name, id } = timeUnits?.find(c => c.id === val) as ITimeUnit;
            setSchedule({ ...schedule, bracketTimeUnitName: name, bracketTimeUnitId: id, slotTimeUnitName: name, slotTimeUnitId: id, slotDuration: 1 });
          }}
          {...props}
        />
      </Box>



      <Box mb={4}>
        <SelectLookup
          noEmptyValue
          disabled={!!schedule.id}
          lookupName="Booking Slot Length"
          helperText={`The # of ${schedule.slotTimeUnitName}s to deduct from the bracket upon accepting a booking. Alternatively, if you meet with clients, this is the length of time per session.`}
          lookupValue={schedule.slotTimeUnitId}
          lookups={timeUnits.filter(sc => [timeUnitOrder.indexOf(schedule.bracketTimeUnitName), Math.max(timeUnitOrder.indexOf(schedule.bracketTimeUnitName) - 1, 0)].includes(timeUnitOrder.indexOf(sc.name)))}
          lookupChange={(val: string) => {
            const { name, id } = timeUnits?.find(c => c.id === val) || {};
            if (!name || !id) return;
            setSchedule({ ...schedule, slotTimeUnitName: name, slotTimeUnitId: id, slotDuration: 1 })
          }}
          {...props}
        />

        <Box mt={2} sx={{ display: 'flex', alignItems: 'baseline' }}>
          <Box>{schedule.slotDuration} <span>&nbsp;</span> &nbsp;</Box>
          <Slider
            disabled={!!schedule.id}
            value={schedule.slotDuration}
            step={null}
            marks={slotDurationMarks}
            max={Math.max(...slotDurationMarks.map(m => m.value))}
            onChange={(_, val) => {
              setSchedule({ ...schedule, slotDuration: parseFloat(val.toString()) });
            }}
          />
        </Box>
      </Box>

    </DialogContent>
    <DialogActions>
      <Grid container justifyContent="space-between">
        <Button onClick={closeModal}>{schedule.id ? 'Close' : 'Cancel'}</Button>
        <Button onClick={handleSubmit}>Submit</Button>
      </Grid>
    </DialogActions>
  </>
}

export default ManageScheduleModal;