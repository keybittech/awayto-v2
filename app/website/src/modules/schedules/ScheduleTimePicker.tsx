import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router';
import dayjs from 'dayjs';
import { Duration, DurationUnitType } from 'dayjs/plugin/duration';

import TextField from '@mui/material/TextField';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

import { getRelativeDuration, IGroupScheduleDateSlots, IQuote, ITimeUnitNames, TimeUnit } from 'awayto/core';
import { sh } from 'awayto/hooks';

type ScheduleTimePickerType = {
  scheduleId?: string;
  bracketSlotDate?: dayjs.Dayjs | null;
  bracketSlotTime?: dayjs.Dayjs | null;
  firstAvailable?: IGroupScheduleDateSlots & { time: dayjs.Dayjs };
  onTimeChange?(props: { time: dayjs.Dayjs | null, quote?: IQuote }): void;
  onTimeAccept?(value: IQuote): void;
}

declare global {
  interface IProps extends ScheduleTimePickerType {}
}

export function ScheduleTimePicker(props: IProps): JSX.Element {

  const { scheduleId, bracketSlotDate, firstAvailable, bracketSlotTime, onTimeChange, onTimeAccept } = props as Required<ScheduleTimePickerType>;

  const { groupName } = useParams();
  if (!groupName) return <></>;

  const [_, { data: dateSlots }] = sh.useLazyGetGroupScheduleByDateQuery();
  
  const { data: lookups } = sh.useGetLookupsQuery();
  if (!lookups) return <></>;

  const { data: groupSchedules } = sh.useGetGroupSchedulesQuery({ groupName });
  if (!groupSchedules) return <></>;

  const didInit = useRef(false);

  const { bracketTimeUnitId, slotTimeUnitId } = groupSchedules.find(gs => gs.id === scheduleId) || {};
  const bracketTimeUnitName = lookups.timeUnits.find(u => u.id === bracketTimeUnitId)?.name as ITimeUnitNames;
  const slotTimeUnitName = lookups.timeUnits.find(u => u.id === slotTimeUnitId)?.name as ITimeUnitNames;
  const sessionDuration = Math.round(getRelativeDuration(1, bracketTimeUnitName, slotTimeUnitName));
  
  const slotFactors = [] as number[];
  for (let factor = 1; factor < sessionDuration; factor++) {
    if (sessionDuration % factor === 0) {
      slotFactors.push(factor);
    }
  }

  const bracketSlotDateDayDiff = useMemo(() => {
    if (bracketSlotDate) {
      const startOfDay = bracketSlotDate.startOf('day');
      return startOfDay.diff(startOfDay.day(0), TimeUnit.DAY);
    }
    return 0;
  }, [bracketSlotDate]);

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
    let quote: IQuote | undefined = undefined;
    if (time) {
      const currentSlotDate = bracketSlotDate || firstAvailable.time;
      const date = currentSlotDate.format('YYYY-MM-DD');
      const slot = getSlot(time, date);
      if (slot) {
        quote = {
          slotDate: date,
          startTime: slot.startTime,
          scheduleBracketSlotId: slot.scheduleBracketSlotId,
        } as IQuote;
      }
    }
    return quote;
  }

  useEffect(() => {
    if (dateSlots?.length && firstAvailable.time && !didInit.current) {
      didInit.current = true;
      const quote = getQuote(firstAvailable.time);
      quote && onTimeAccept(quote);
    }
  }, [dateSlots, firstAvailable, didInit.current]);

  return <TimePicker
    label="Time"
    value={bracketSlotTime}
    onChange={time => {
      const quote = getQuote(time)
      onTimeChange({ time, quote });
    }}
    ampmInClock={true}
    ignoreInvalidInputs={true}
    onAccept={time => {
      const quote = getQuote(time);
      if (quote) onTimeAccept(quote);
    }}
    shouldDisableTime={(time, clockType) => {
      if (dateSlots?.length) {
        const currentSlotTime = bracketSlotTime;
        const currentSlotDate = bracketSlotDate || firstAvailable.time;
        // Ignore seconds check because final time doesn't need seconds, so this will cause invalidity
        if ('seconds' === clockType) return false;

        // Create a duration based on the current clock validation check and the days from start of current week
        let duration: Duration = dayjs.duration(time, clockType).add(bracketSlotDateDayDiff, TimeUnit.DAY);

        // Submitting a new time a two step process, an hour is selected, and then a minute. Upon hour selection, bracketSlotTime is first set, and then when the user selects a minute, that will cause this block to run, so we should add the existing hour from bracketSlotTime such that "hour + minute" will give us the total duration, i.e. 4:30 AM = PT4H30M
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