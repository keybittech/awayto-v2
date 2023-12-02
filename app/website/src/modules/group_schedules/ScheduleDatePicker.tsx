import React, { useContext } from 'react';

import TextField from '@mui/material/TextField';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';

import { useContexts } from 'awayto/hooks';
import { dayjs } from 'awayto/core';

export function ScheduleDatePicker(): React.JSX.Element {

  const {
    setStartOfMonth,
    selectedDate,
    setSelectedDate,
    firstAvailable,
    dateSlots,
  } = useContext(useContexts().GroupScheduleSelectionContext) as GroupScheduleSelectionContextType;

  return <DesktopDatePicker
    value={selectedDate}
    onChange={(date: dayjs.Dayjs | null) => setSelectedDate(date ? date.isBefore(firstAvailable.time) ? firstAvailable.time : date : null)}
    label="Date"
    inputFormat="MM/DD/YYYY"
    minDate={firstAvailable.time}
    onOpen={() => setStartOfMonth(selectedDate.isAfter(firstAvailable.time) ? selectedDate.startOf('month') : firstAvailable.time)}
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
