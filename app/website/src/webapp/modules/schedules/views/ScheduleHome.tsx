import React from 'react';

import { IScheduleActionTypes, IGroupServiceActionTypes, IGroupScheduleActionTypes, IGroupUserScheduleActionTypes } from 'awayto';
import { useRedux, useComponents } from 'awayto-hooks';

const { GET_GROUP_SERVICES } = IGroupServiceActionTypes;
const { GET_GROUP_SCHEDULES } = IGroupScheduleActionTypes;
const { POST_GROUP_USER_SCHEDULE } = IGroupUserScheduleActionTypes;

const { GET_SCHEDULES, GET_SCHEDULE_BY_ID, POST_SCEHDULE_BRACKETS, POST_SCHEDULE } = IScheduleActionTypes;

export const scheduleSchema = {
  id: '',
  name: '',
  startTime: '',
  endTime: '',
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

export function ScheduleHome(): JSX.Element {

  const { ManageScheduleBrackets } = useComponents();
  const { schedules } = useRedux(state => state.schedule);
  const { groupServices } = useRedux(state => state.groupService);
  const { groupSchedules } = useRedux(state => state.groupSchedule);

  return <>

    <ManageScheduleBrackets
      schedules={schedules}
      groupServices={groupServices}
      groupSchedules={groupSchedules}
      getScheduleByIdAction={GET_SCHEDULE_BY_ID}
      getGroupServicesAction={GET_GROUP_SERVICES}
      getGroupSchedulesAction={GET_GROUP_SCHEDULES}
      postScheduleAction={POST_SCHEDULE}
      postGroupUserScheduleAction={POST_GROUP_USER_SCHEDULE}
      getScheduleBracketsAction={GET_SCHEDULES}
      postScheduleBracketsAction={POST_SCEHDULE_BRACKETS}
    />

  </>
}

export default ScheduleHome;