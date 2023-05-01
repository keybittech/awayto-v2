import React from 'react';
import dayjs from 'dayjs';

import TextField from '@mui/material/TextField';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';

import { IGroupScheduleDateSlots } from 'awayto/core';

type ScheduleDatePickerType = {  
  firstAvailable?: IGroupScheduleDateSlots & { time: dayjs.Dayjs };
  bracketSlotDate?: dayjs.Dayjs | null;
  dateSlots?: IGroupScheduleDateSlots[];
  onDateChange?(value: dayjs.Dayjs | null, keyboardInputValue?: string | undefined): void;
  setStartOfMonth?(value: dayjs.Dayjs): void;
}

declare global {
  interface IProps extends ScheduleDatePickerType {}
}

export function ScheduleDatePicker(props: IProps): JSX.Element {

  const { firstAvailable, bracketSlotDate, dateSlots, onDateChange, setStartOfMonth } = props as Required<ScheduleDatePickerType>;

  return <DesktopDatePicker
    value={bracketSlotDate}
    onChange={onDateChange}
    label="Date"
    inputFormat="MM/DD/YYYY"
    minDate={firstAvailable.time}
    onOpen={() => setStartOfMonth(firstAvailable.time)}
    onMonthChange={date => date && setStartOfMonth(date)}
    onYearChange={date => date && setStartOfMonth(date)}
    renderInput={(params) => <TextField fullWidth {...params} />}
    disableHighlightToday={true}
    shouldDisableDate={date => {
      if (date && dateSlots?.length) {
        return !dateSlots.filter(s => s.startDate === date.format("YYYY-MM-DD")).length;
      }
      return true;
    }}
  />
}

export default ScheduleDatePicker;