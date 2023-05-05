import React, { useContext, useMemo, useState } from 'react';
import dayjs from 'dayjs';

import { IGroupScheduleDateSlots, IQuote, TimeUnit, quotedDT, userTimezone } from 'awayto/core';
import { sh, useContexts } from 'awayto/hooks';

export function GroupScheduleSelectionProvider({ children }: IProps): JSX.Element {

  const { GroupContext, GroupScheduleContext, GroupScheduleSelectionContext } = useContexts();

  const { group } = useContext(GroupContext) as GroupContextType;

  const { groupSchedule } = useContext(GroupScheduleContext) as GroupScheduleContextType;
  
  const [firstAvailable, setFirstAvailable] = useState({ time: dayjs().startOf('day') } as IGroupScheduleDateSlots);
  const [startOfMonth, setStartOfMonth] = useState(dayjs().startOf(TimeUnit.MONTH));
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>();
  const [selectedTime, setSelectedTime] = useState<dayjs.Dayjs | null>();
  const [quote, setQuote] = useState({} as IQuote);

  const { data: dateSlots } = sh.useGetGroupScheduleByDateQuery({
    groupName: group?.name || '',
    scheduleId: groupSchedule?.id || '',
    date: startOfMonth.format("YYYY-MM-DD"),
    timezone: btoa(userTimezone)
  }, { skip: !group || !groupSchedule });

  if (dateSlots?.length && !firstAvailable.scheduleBracketSlotId) {
    const [slot] = dateSlots;
    const firstAvail = { ...slot, time: quotedDT(slot.weekStart, slot.startTime) };
    setFirstAvailable(firstAvail);
    setSelectedDate(firstAvail.time);
  }

  const groupScheduleSelectionContext = {
    quote,
    setQuote,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    startOfMonth,
    setStartOfMonth,
    dateSlots,
    firstAvailable,
  } as GroupScheduleSelectionContextType | null;

  return useMemo(() => !GroupScheduleSelectionContext ? <></> :
    <GroupScheduleSelectionContext.Provider value={groupScheduleSelectionContext}>
      {children}
    </GroupScheduleSelectionContext.Provider>,
    [GroupScheduleSelectionContext, groupScheduleSelectionContext]
  );
}

export default GroupScheduleSelectionProvider;