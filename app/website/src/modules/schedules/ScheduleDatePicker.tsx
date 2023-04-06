import React, { useState } from 'react';
import dayjs from 'dayjs';

import TextField from '@mui/material/TextField';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';

import { IGroupScheduleDateSlots, TimeUnit, userTimezone } from 'awayto/core';
import { sh } from 'awayto/hooks';

type ScheduleDatePickerType = {  
  groupName?: string;
  scheduleId?: string;
  firstAvailable?: IGroupScheduleDateSlots & { time: dayjs.Dayjs };
  bracketSlotDate?: dayjs.Dayjs | null;
  onDateChange?(value: dayjs.Dayjs | null, keyboardInputValue?: string | undefined): void;
}

declare global {
  interface IProps extends ScheduleDatePickerType {}
}

export function ScheduleDatePicker(props: IProps): JSX.Element {

  const { groupName, scheduleId, firstAvailable, bracketSlotDate, onDateChange } = props as Required<ScheduleDatePickerType>;

  const [monthSeekDate, setMonthSeekDate] = useState(dayjs().startOf(TimeUnit.MONTH));

  const { data: dateSlots } = sh.useGetGroupScheduleByDateQuery({
    groupName,
    scheduleId,
    date: monthSeekDate.format("YYYY-MM-DD"),
    timezone: btoa(userTimezone)
  });

  return <DesktopDatePicker
    value={bracketSlotDate}
    onChange={onDateChange}
    label="Date"
    inputFormat="MM/DD/YYYY"
    minDate={firstAvailable.time}
    onOpen={() => setMonthSeekDate(firstAvailable.time)}
    onMonthChange={date => date && setMonthSeekDate(date)}
    onYearChange={date => date && setMonthSeekDate(date)}
    renderInput={(params) => <TextField fullWidth {...params} />}
    disableHighlightToday={true}
    shouldDisableDate={date => {
      if (date && dateSlots.length) {
        return !dateSlots.filter(s => s.startDate === date.format("YYYY-MM-DD")).length;
      }
      return true;
    }}
  />
}

export default ScheduleDatePicker;