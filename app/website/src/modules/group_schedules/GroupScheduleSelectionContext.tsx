import { FunctionComponent, createContext } from 'react';
import dayjs from 'dayjs';

import { IGroupScheduleDateSlots, IQuote } from 'awayto/core';

declare global {
  type GroupScheduleSelectionContextType = {
    quote: IQuote;
    selectedDate: dayjs.Dayjs;
    selectedTime: dayjs.Dayjs;
    startOfMonth: dayjs.Dayjs;
    dateSlots: IGroupScheduleDateSlots[];
    firstAvailable: IGroupScheduleDateSlots;
    GroupScheduleDateSelection: FunctionComponent<IProps>;
    GroupScheduleTimeSelection: FunctionComponent<IProps>;
  }
}

export const GroupScheduleContext = createContext<GroupScheduleSelectionContextType | null>(null);

export default GroupScheduleContext;