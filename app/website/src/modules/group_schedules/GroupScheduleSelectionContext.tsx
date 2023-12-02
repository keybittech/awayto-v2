import { FunctionComponent, createContext } from 'react';

import { dayjs, IGroupScheduleDateSlots, IQuote } from 'awayto/core';

declare global {
  type GroupScheduleSelectionContextType = {
    quote: IQuote;
    setQuote(quote: IQuote): void;
    selectedDate: dayjs.Dayjs;
    setSelectedDate(date: dayjs.Dayjs | null): void;
    selectedTime: dayjs.Dayjs;
    setSelectedTime(time: dayjs.Dayjs | null): void;
    startOfMonth: dayjs.Dayjs;
    setStartOfMonth(start: dayjs.Dayjs): void;
    dateSlots: IGroupScheduleDateSlots[];
    firstAvailable: IGroupScheduleDateSlots;
    bracketSlotDateDayDiff: number;
    GroupScheduleDateSelection: FunctionComponent<IProps>;
    GroupScheduleTimeSelection: FunctionComponent<IProps>;
  }
}

export const GroupScheduleSelectionContext = createContext<GroupScheduleSelectionContextType | null>(null);

export default GroupScheduleSelectionContext;
