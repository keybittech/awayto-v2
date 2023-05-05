import React, { useContext, useEffect, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { Duration, DurationUnitType } from 'dayjs/plugin/duration';

import TextField from '@mui/material/TextField';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

import { getRelativeDuration, IGroupScheduleDateSlots, IQuote, TimeUnit } from 'awayto/core';
import { useContexts, useTimeName } from 'awayto/hooks';

type ScheduleTimePickerType = {
  onTimeAccept?(value: IQuote): void;
}

declare global {
  interface IProps extends ScheduleTimePickerType {}
}

export function ScheduleTimePicker({ onTimeAccept }: IProps): JSX.Element {

  const { GroupScheduleContext, GroupScheduleSelectionContext } = useContexts();

  const {
    groupSchedule,
  } = useContext(GroupScheduleContext) as GroupScheduleContextType;

  const { 
    quote,
    setQuote,
    selectedDate,
    selectedTime,
    setSelectedTime,
    firstAvailable,
    dateSlots
  } = useContext(GroupScheduleSelectionContext) as GroupScheduleSelectionContextType;

  const didInit = useRef(false);
  
  const { bracketTimeUnitId, slotTimeUnitId } = groupSchedule || {};
  const bracketTimeUnitName = useTimeName(bracketTimeUnitId);
  const slotTimeUnitName = useTimeName(slotTimeUnitId);
  const sessionDuration = Math.round(getRelativeDuration(1, bracketTimeUnitName, slotTimeUnitName));
  
  const slotFactors = [] as number[];
  for (let factor = 1; factor < sessionDuration; factor++) {
    if (sessionDuration % factor === 0) {
      slotFactors.push(factor);
    }
  }

  const bracketSlotDateDayDiff = useMemo(() => {
    if (selectedDate) {
      const startOfDay = selectedDate.startOf('day');
      return startOfDay.diff(startOfDay.day(0), TimeUnit.DAY);
    }
    return 0;
  }, [selectedDate]);

  function getSlot(time: dayjs.Dayjs, date: string): IGroupScheduleDateSlots | undefined {
    const timeHour = time.hour();
    const timeMins = time.minute();
    const duration = dayjs.duration(0)
      .add(bracketSlotDateDayDiff, TimeUnit.DAY)
      .add(timeHour, TimeUnit.HOUR)
      .add(timeMins, TimeUnit.MINUTE);
    const [slot] = dateSlots?.filter(s => s.startDate === date && duration.hours() === s.hour && duration.minutes() === s.minute) || [];

    return slot;
  }

  function getQuote(time: dayjs.Dayjs | null): IQuote | undefined {
    let newQuote: IQuote | undefined = undefined;
    if (time) {
      const currentSlotDate = selectedDate || firstAvailable.time;
      const date = currentSlotDate.format('YYYY-MM-DD');
      const slot = getSlot(time, date);
      if (slot) {
        newQuote = {
          slotDate: date,
          startTime: slot.startTime,
          scheduleBracketSlotId: slot.scheduleBracketSlotId,
        } as IQuote;
      }
    }
    return newQuote;
  }

  useEffect(() => {
    if (dateSlots?.length && firstAvailable.time && !didInit.current) {
      didInit.current = true;
      const newQuote = getQuote(firstAvailable.time);
      newQuote && onTimeAccept && onTimeAccept(newQuote);
    }
  }, [dateSlots, firstAvailable, didInit.current]);

  return <TimePicker
    label="Time"
    value={selectedTime}
    onChange={time => {
      setSelectedTime(time);
      const newQuote = getQuote(time)
      newQuote && setQuote({ ...quote, ...newQuote });
    }}
    ampmInClock={true}
    ignoreInvalidInputs={true}
    onAccept={time => {
      const newQuote = getQuote(time);
      if (newQuote) {
        setQuote({ ...quote, ...newQuote });
        onTimeAccept && onTimeAccept(newQuote);
      }
    }}
    shouldDisableTime={(time, clockType) => {
      if (dateSlots?.length) {
        const currentSlotTime = selectedTime;
        const currentSlotDate = selectedDate || firstAvailable.time;
        // Ignore seconds check because final time doesn't need seconds, so this will cause invalidity
        if ('seconds' === clockType) return false;

        // Create a duration based on the current clock validation check and the days from start of current week
        let duration: Duration = dayjs.duration(time, clockType).add(bracketSlotDateDayDiff, TimeUnit.DAY);

        // Submitting a new time a two step process, an hour is selected, and then a minute. Upon hour selection, selectedTime is first set, and then when the user selects a minute, that will cause this block to run, so we should add the existing hour from selectedTime such that "hour + minute" will give us the total duration, i.e. 4:30 AM = PT4H30M
        if ('minutes' === clockType && currentSlotTime) {
          duration = duration.add(currentSlotTime.hour(), TimeUnit.HOUR);
        }

        // When checking hours, we need to also check the hour + next session time, because shouldDisableTime checks atomic parts of the clock, either hour or minute, but no both. So instead of keeping track of some ongoing clock, we can just check both durations here
        const checkDurations: Duration[] = [duration];
        if ('hours' === clockType) {
          for (const factor of slotFactors) {
            checkDurations.push(duration.add(factor, slotTimeUnitName as DurationUnitType));
          }
        }

        const matches = dateSlots.filter(s => s.startDate === currentSlotDate.format("YYYY-MM-DD") && checkDurations.filter(d => d.hours() === s.hour && d.minutes() === s.minute).length > 0);
        // Checks that have no existing slots are invalid
        return !matches.length;
      }
      return true;
    }}
    renderInput={params => <TextField fullWidth {...params} />}
  />
}

export default ScheduleTimePicker;