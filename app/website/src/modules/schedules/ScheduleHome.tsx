import React from 'react';

import { useComponents } from 'awayto/hooks';

export const scheduleSchema = {
  id: '',
  name: '',
  startTime: '',
  endTime: '',
  timezone: '',
  slotDuration: 30,
  scheduleTimeUnitId: '',
  scheduleTimeUnitName: '',
  bracketTimeUnitId: '',
  bracketTimeUnitName: '',
  slotTimeUnitId: '',
  slotTimeUnitName: ''
};

export const bracketSchema = {
  duration: 1,
  automatic: false,
  multiplier: '1.00'
};

export function ScheduleHome(props: IProps): JSX.Element {
  const { ManageScheduleBrackets } = useComponents();
  return <ManageScheduleBrackets {...props} />
}

export default ScheduleHome;