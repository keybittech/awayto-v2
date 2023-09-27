import React, { useState, useCallback, useMemo, useEffect } from 'react';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Slider from '@mui/material/Slider';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import { Mark } from '@mui/base';

import { ISchedule, ITimeUnit, TimeUnit, timeUnitOrder, getRelativeDuration,  scheduleSchema, IGroup } from 'awayto/core';
import { useComponents, useUtil, sh, useTimeName } from 'awayto/hooks';

declare global {
  interface IProps {
    showCancel?: boolean;
    editGroup?: IGroup;
    editSchedule?: ISchedule;
  }
}

export function ManageSchedulesModal({ children, editGroup, editSchedule, showCancel = true, closeModal, ...props }: IProps): React.JSX.Element {

  const { setSnack } = useUtil();

  const [postSchedule] = sh.usePostScheduleMutation();
  const [putSchedule] = sh.usePutScheduleMutation();
  const [postGroupSchedule] = sh.usePostGroupScheduleMutation();
  const [getGroupScheduleMasterById] = sh.useLazyGetGroupScheduleMasterByIdQuery();

  const { data: lookups, isSuccess: lookupsRetrieved } = sh.useGetLookupsQuery();

  const { SelectLookup } = useComponents();

  const [schedule, setSchedule] = useState({ ...scheduleSchema, ...editSchedule } as ISchedule);

  const scheduleTimeUnitName = useTimeName(schedule?.scheduleTimeUnitId);
  const bracketTimeUnitName = useTimeName(schedule?.bracketTimeUnitId);
  const slotTimeUnitName = useTimeName(schedule?.slotTimeUnitId);

  const setDefault = useCallback((type: string) => {
    const weekId = lookups?.timeUnits?.find(s => s.name === TimeUnit.WEEK)?.id;
    const hourId = lookups?.timeUnits?.find(s => s.name === TimeUnit.HOUR)?.id;
    const dayId = lookups?.timeUnits?.find(s => s.name === TimeUnit.DAY)?.id;
    const minuteId = lookups?.timeUnits?.find(s => s.name === TimeUnit.MINUTE)?.id;
    const monthId = lookups?.timeUnits?.find(s => s.name === TimeUnit.MONTH)?.id;
    if ('hoursweekly30minsessions' === type) {
      setSchedule({
        ...schedule,
        scheduleTimeUnitId: weekId as string,
        bracketTimeUnitId: hourId as string,
        slotTimeUnitId: minuteId as string,
        slotDuration: 30
      });
    } else if ('dailybookingpermonth') {
      setSchedule({
        ...schedule,
        scheduleTimeUnitId: monthId as string,
        bracketTimeUnitId: weekId as string,
        slotTimeUnitId: dayId as string,
        slotDuration: 1
      });
    }
  }, [lookups, schedule]);

  const slotDurationMarks = useMemo(() => {
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
  }, [bracketTimeUnitName, slotTimeUnitName, scheduleTimeUnitName]);

  const handleSubmit = useCallback(() => {
    if (!schedule.name) {
      setSnack({ snackOn: 'A name must be provided.', snackType: 'warning' });
      return;
    }

    schedule.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (!editGroup) {
      (schedule.id ? putSchedule : postSchedule)(schedule).unwrap().then(({ id }) => {
        !schedule.id && postGroupSchedule({ scheduleId: id }).catch(console.error);
        closeModal && closeModal({ ...schedule, id });
      }).catch(console.error);
    } else {
      closeModal && closeModal(schedule);
    }
  }, [schedule]);

  useEffect(() => {
    async function go() {
      if (lookupsRetrieved) {
        if (editSchedule?.id) {
          const masterSchedule = await getGroupScheduleMasterById({ scheduleId: editSchedule.id }).unwrap();
          setSchedule(masterSchedule);
        } else {
          setDefault('hoursweekly30minsessions');
        }
      }
    }
    void go();
  }, [lookupsRetrieved]);

  if (!lookups?.timeUnits) return <></>;

  return <Card>
    <CardHeader title={`${editSchedule ? 'Edit' : 'Create'} Schedule`}></CardHeader>
    <CardContent>
      {!!children && children}

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
          <Button color="secondary" onClick={() => setDefault('hoursweekly30minsessions')}>weekly, 30 minute appointments</Button>
          <Button color="secondary" onClick={() => setDefault('dailybookingpermonth')}>monthly, full-day booking</Button>
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
          lookups={lookups?.timeUnits?.filter(sc => sc.name !== scheduleTimeUnitName && timeUnitOrder.indexOf(sc.name) <= timeUnitOrder.indexOf(scheduleTimeUnitName))}
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
          helperText={`The # of ${slotTimeUnitName}s to deduct from the bracket upon accepting a booking. Alternatively, if you meet with clients, this is the length of time per session.`}
          lookupValue={schedule.slotTimeUnitId}
          lookups={lookups?.timeUnits?.filter(sc => [timeUnitOrder.indexOf(bracketTimeUnitName), Math.max(timeUnitOrder.indexOf(bracketTimeUnitName) - 1, 0)].includes(timeUnitOrder.indexOf(sc.name)))}
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
    </CardContent>
    <CardActions>
      <Grid container justifyContent={showCancel ? "space-between" : "flex-end"}>
        {showCancel && <Button onClick={closeModal}>Cancel</Button>}
        <Button disabled={!schedule.name} onClick={handleSubmit}>Save Schedule</Button>
      </Grid>
    </CardActions>
  </Card>
}

export default ManageSchedulesModal;