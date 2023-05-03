import React, { useContext, useMemo, useState } from 'react';
import dayjs from 'dayjs';

import Grid from '@mui/material/Grid';

import { IGroupScheduleDateSlots, IQuote, TimeUnit, quotedDT, userTimezone } from 'awayto/core';
import { sh, useComponents, useContexts } from 'awayto/hooks';

export function GroupScheduleSelectionProvider({ children }: IProps): JSX.Element {
  const { ScheduleDatePicker, ScheduleTimePicker } = useComponents();

  const { GroupContext, GroupScheduleContext, GroupScheduleSelectionContext } = useContexts();

  const { group } = useContext(GroupContext) as GroupContextType;

  const { groupSchedule } = useContext(GroupScheduleContext) as GroupScheduleContextType;

  const [startOfMonth, setStartOfMonth] = useState(dayjs().startOf(TimeUnit.MONTH));

  const { data: dateSlots } = sh.useGetGroupScheduleByDateQuery({
    groupName: group?.name || '',
    scheduleId: groupSchedule?.id || '',
    date: startOfMonth.format("YYYY-MM-DD"),
    timezone: btoa(userTimezone)
  }, { skip: !group || !groupSchedule });
  
  const [firstAvailable, setFirstAvailable] = useState({ time: dayjs().startOf('day') } as IGroupScheduleDateSlots);

  if (dateSlots?.length && !firstAvailable.scheduleBracketSlotId) {
    const [slot] = dateSlots;
    setFirstAvailable({ ...slot, time: quotedDT(slot.weekStart, slot.startTime) });
  }
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>();
  const [selectedTime, setSelectedTime] = useState<dayjs.Dayjs | null>();
  const [quote, setQuote] = useState({} as IQuote);

  const groupScheduleSelectionContext = {
    quote,
    startOfMonth,
    dateSlots,
    firstAvailable,
    selectedDate,
    selectedTime,
    GroupScheduleSelectionPickers() {
      return <Grid container spacing={2}>
        <Grid item xs={4}>
          <ScheduleDatePicker
            key={groupSchedule.id}
            dateSlots={dateSlots}
            firstAvailable={firstAvailable}
            bracketSlotDate={selectedDate || firstAvailable.time || null}
            setStartOfMonth={setStartOfMonth}
            onDateChange={(date: dayjs.Dayjs | null) => setSelectedDate(date ? date.isBefore(firstAvailable.time) ? firstAvailable.time : date  : null)}
          />  
        </Grid>
        <Grid item xs={4}>
          <ScheduleTimePicker
            key={groupSchedule.id}
            scheduleId={groupSchedule.id}
            firstAvailable={firstAvailable}
            bracketSlotDate={selectedDate}
            value={selectedTime || firstAvailable.time}
            onTimeChange={({ time, quote: newQuote }: { time: dayjs.Dayjs | null, quote?: IQuote }) => {
              setSelectedTime(time);
              if (newQuote) {
                setQuote({ ...quote, ...newQuote })
              }
            }}
            onTimeAccept={(newQuote: IQuote) => {
              setQuote({ ...quote, ...newQuote })
            }}
          />
        </Grid>
      </Grid>
    }
  } as GroupScheduleSelectionContextType | null;

  return useMemo(() => !GroupScheduleSelectionContext ? <></> :
    <GroupScheduleSelectionContext.Provider value={groupScheduleSelectionContext}>
      {children}
    </GroupScheduleSelectionContext.Provider>,
    [GroupScheduleSelectionContext, groupScheduleSelectionContext]
  );
}

export default GroupScheduleSelectionProvider;