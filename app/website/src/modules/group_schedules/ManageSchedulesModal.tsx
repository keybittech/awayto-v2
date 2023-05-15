import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams } from 'react-router';

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
import { Mark } from '@mui/base';

import { ISchedule, ITimeUnit, TimeUnit, timeUnitOrder, getRelativeDuration, ITimeUnitNames, IGroupSchedule, scheduleSchema } from 'awayto/core';
import { useComponents, useUtil, sh } from 'awayto/hooks';

declare global {
  interface IProps {
    editSchedule?: ISchedule;
  }
}

export function ManageScheduleModal({ editSchedule, closeModal, ...props }: IProps): React.JSX.Element {

  const { groupName } = useParams();
  if (!groupName) return <></>;

  const { setSnack } = useUtil();

  const [postGroupSchedule] = sh.usePostGroupScheduleMutation();
  const [putGroupSchedule] = sh.usePutGroupScheduleMutation();
  const [getGroupScheduleMasterById] = sh.useLazyGetGroupScheduleMasterByIdQuery();

  const { data: lookups, isSuccess: lookupsRetrieved } = sh.useGetLookupsQuery();
  
  const { SelectLookup } = useComponents();
  
  const [schedule, setSchedule] = useState({ ...scheduleSchema, ...editSchedule } as ISchedule);

  const attachScheduleUnits = useCallback((sched: ISchedule): ISchedule => {
    sched.scheduleTimeUnitName = lookups?.timeUnits?.find(u => u.id === sched.scheduleTimeUnitId)?.name as ITimeUnitNames;
    sched.bracketTimeUnitName = lookups?.timeUnits?.find(u => u.id === sched.bracketTimeUnitId)?.name as ITimeUnitNames;
    sched.slotTimeUnitName = lookups?.timeUnits?.find(u => u.id === sched.slotTimeUnitId)?.name as ITimeUnitNames;
    return sched;
  }, [lookups]);

  const setDefault = useCallback((type: string) => {
    const weekId = lookups?.timeUnits?.find(s => s.name === TimeUnit.WEEK)?.id;
    const hourId = lookups?.timeUnits?.find(s => s.name === TimeUnit.HOUR)?.id;
    const dayId = lookups?.timeUnits?.find(s => s.name === TimeUnit.DAY)?.id;
    const minuteId = lookups?.timeUnits?.find(s => s.name === TimeUnit.MINUTE)?.id;
    const monthId = lookups?.timeUnits?.find(s => s.name === TimeUnit.MONTH)?.id;
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
  }, [lookups, schedule]);

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

    async function go() {
      const { id, name, startTime, endTime } = schedule;
      if (groupName) {
        if (!id) {
          if (name && startTime) {
            schedule.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            await postGroupSchedule({ groupName, schedule }).unwrap();
            setSnack({ snackOn: 'Successfully added ' + name + ' as a master schedule!', snackType: 'success' });
          } else {
            setSnack({ snackOn: 'Must have schedule name and start date.', snackType: 'warning' });
            return;
          }
        } else {
          await putGroupSchedule({ id, startTime, endTime, groupName } as IGroupSchedule).unwrap();
          setSnack({ snackOn: 'Schedule updated!', snackType: 'info' });
        }
    
        if (closeModal)
          closeModal();
      }
    }
    void go();
  }, [schedule, groupName]);

  useEffect(() => {
    async function go() {
      if (lookupsRetrieved) {
        if (groupName && editSchedule) {
          const masterSchedule = await getGroupScheduleMasterById({ groupName, scheduleId: editSchedule.id }).unwrap();
          attachScheduleUnits(masterSchedule);
          setSchedule(masterSchedule);
        } else {
          setDefault('40hoursweekly30minsessions');
        }
      }
    }
    void go();
  }, [lookupsRetrieved]);
  
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
          lookups={lookups?.timeUnits?.filter(sc => ![TimeUnit.MINUTE, TimeUnit.HOUR, TimeUnit.YEAR].includes(sc.name as TimeUnit))}
          lookupChange={(val: string) => {
            const { id, name } = lookups?.timeUnits?.find(c => c.id === val) || {};
            if (!id || !name) return;
            setSchedule({ ...schedule, scheduleTimeUnitName: name, scheduleTimeUnitId: id, bracketTimeUnitId: lookups?.timeUnits?.find(s => s.name === timeUnitOrder[timeUnitOrder.indexOf(name) - 1])?.id as string })
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
          lookups={lookups?.timeUnits?.filter(sc => sc.name !== schedule.scheduleTimeUnitName && timeUnitOrder.indexOf(sc.name) <= timeUnitOrder.indexOf(schedule.scheduleTimeUnitName))}
          lookupChange={(val: string) => {
            const { name, id } = lookups?.timeUnits?.find(c => c.id === val) as ITimeUnit;
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
          lookups={lookups?.timeUnits?.filter(sc => [timeUnitOrder.indexOf(schedule.bracketTimeUnitName), Math.max(timeUnitOrder.indexOf(schedule.bracketTimeUnitName) - 1, 0)].includes(timeUnitOrder.indexOf(sc.name)))}
          lookupChange={(val: string) => {
            const { name, id } = lookups?.timeUnits?.find(c => c.id === val) || {};
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