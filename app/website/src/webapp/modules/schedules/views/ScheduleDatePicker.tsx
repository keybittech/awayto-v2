import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';

import TextField from '@mui/material/TextField';
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';

import { IGroupScheduleDateSlots, IGroupScheduleActionTypes, TimeUnit, userTimezone } from 'awayto';
import { useApi, useRedux } from 'awayto-hooks';

const { GET_GROUP_SCHEDULE_BY_DATE } = IGroupScheduleActionTypes;

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

  const api = useApi();

  const [monthSeekDate, setMonthSeekDate] = useState(dayjs().startOf(TimeUnit.MONTH));

  const { dateSlots } = useRedux(state => state.groupSchedule);

  useEffect(() => {
    if (groupName && scheduleId) {
      const [abort, res] = api(GET_GROUP_SCHEDULE_BY_DATE, {
        groupName,
        scheduleId,
        date: monthSeekDate.format("YYYY-MM-DD"),
        timezone: btoa(userTimezone)
      });
      res?.catch(console.warn);
      return () => abort();
    }
  }, [groupName, scheduleId, monthSeekDate]);

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