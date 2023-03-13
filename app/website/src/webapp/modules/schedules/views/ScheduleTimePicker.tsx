import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Duration, DurationUnitType } from 'dayjs/plugin/duration';

import TextField from '@mui/material/TextField';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

import { getRelativeDuration, IGroupScheduleDateSlots, IQuote, ISchedule, TimeUnit } from 'awayto';
import { useRedux } from 'awayto-hooks';

type ScheduleTimePickerType = {
  bracketTimeUnitName?: string;
  slotTimeUnitName?: string;
  bracketSlotDate?: dayjs.Dayjs | null;
  firstAvailable?: IGroupScheduleDateSlots & { time: dayjs.Dayjs };
  value?: dayjs.Dayjs | null;
  onChange?(value: dayjs.Dayjs | null, keyboardInputValue?: string | undefined): void;
  onAccept?(value: IQuote): void;
}

declare global {
  interface IProps extends ScheduleTimePickerType {}
}

export function ScheduleTimePicker(props: IProps): JSX.Element {

  const { bracketTimeUnitName, slotTimeUnitName, bracketSlotDate, firstAvailable, value, onChange, onAccept } = props as Required<ScheduleTimePickerType>;
  
  const { dateSlots } = useRedux(state => state.groupSchedule);

  const sessionDuration = Math.round(getRelativeDuration(1, bracketTimeUnitName, slotTimeUnitName));
  
  const slotFactors = [] as number[];

  for (let value = 1; value < sessionDuration; value++) {
    if (sessionDuration % value === 0) {
      slotFactors.push(value);
    }
  }

  const bracketSlotDateDayDiff = useMemo(() => {
    if (bracketSlotDate) {
      const startOfDay = bracketSlotDate.startOf('day');
      return startOfDay.diff(startOfDay.day(0), TimeUnit.DAY);
    }
    return 0;
  }, [bracketSlotDate]);

  return <TimePicker
    label="Time"
    value={value}
    onChange={onChange}
    ampmInClock={true}
    ignoreInvalidInputs={true}
    onAccept={time => {
      if (time) {
        const currentSlotDate = bracketSlotDate || firstAvailable.time;

        const timeHour = time.hour();
        const timeMins = time.minute();
        const duration = dayjs.duration(0)
          .add(bracketSlotDateDayDiff, TimeUnit.DAY)
          .add(timeHour, TimeUnit.HOUR)
          .add(timeMins, TimeUnit.MINUTE);
        const [slot] = dateSlots
          .filter(s => s.startDate === currentSlotDate.format("YYYY-MM-DD") && duration.hours() === s.hour && duration.minutes() === s.minute);

        if (slot) {
          onAccept({
            slotDate: currentSlotDate.format('YYYY-MM-DD'),
            scheduleBracketSlotId: slot.scheduleBracketSlotId
          } as IQuote);
        }

      }
    }}
    shouldDisableTime={(time, clockType) => {
      if (dateSlots.length) {
        const currentSlotTime = value;
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
    renderInput={params => <TextField {...params} />}
  />
}

export default ScheduleTimePicker;