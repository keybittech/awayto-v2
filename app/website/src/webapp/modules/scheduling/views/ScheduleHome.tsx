import React, { Suspense, useCallback, useRef, useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import CardHeader from '@mui/material/CardHeader';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Slider from '@mui/material/Slider';
import MenuItem from '@mui/material/MenuItem';

import { IScheduleActionTypes, IUtilActionTypes, ISchedule, IScheduleBracket, IGroupServiceActionTypes, IGroupScheduleActionTypes, IGroup, BookingModes, timeUnitOrder, TimeUnit, ITimeUnitNames, IService, ITimeUnit } from 'awayto';
import { useApi, useRedux, useComponents, useAct } from 'awayto-hooks';
import { Mark } from '@mui/base';

const { GET_GROUP_SERVICES } = IGroupServiceActionTypes;
const { GET_GROUP_SCHEDULES } = IGroupScheduleActionTypes;

const { GET_SCHEDULES, GET_SCHEDULE_BY_ID, POST_SCEHDULE_BRACKETS, POST_SCHEDULE, PUT_SCHEDULE, POST_SCHEDULE_PARENT, DISABLE_SCHEDULE, DELETE_SCHEDULE } = IScheduleActionTypes;
const { SET_SNACK } = IUtilActionTypes;

export const scheduleSchema = {
  id: '',
  name: '',
  duration: 1,
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
  const api = useApi();

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
      postScheduleParentAction={POST_SCHEDULE_PARENT}
      getScheduleBracketsAction={GET_SCHEDULES}
      postScheduleBracketsAction={POST_SCEHDULE_BRACKETS}
    />

  </>
}

export default ScheduleHome;