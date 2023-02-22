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
import moment from 'moment';

const { GET_GROUP_SERVICES } = IGroupServiceActionTypes;
const { GET_GROUP_SCHEDULES } = IGroupScheduleActionTypes;

const { GET_SCHEDULES, POST_SCEHDULE_BRACKETS, POST_SCHEDULE, PUT_SCHEDULE, POST_SCHEDULE_PARENT, DISABLE_SCHEDULE, DELETE_SCHEDULE } = IScheduleActionTypes;
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
  const act = useAct();

  const { ManageScheduleBrackets } = useComponents();
  const [schedule, setSchedule] = useState({ ...scheduleSchema, brackets: {} } as ISchedule);
  const [newBracket, setNewBracket] = useState({ ...bracketSchema, services: {}, slots: {} } as IScheduleBracket);

  const { timeUnits } = useRedux(state => state.forms);
  const { groups } = useRedux(state => state.profile);
  const { schedules } = useRedux(state => state.schedule);
  const { groupServices } = useRedux(state => state.groupService);
  const { groupSchedules } = useRedux(state => state.groupSchedule);
  const [group, setGroup] = useState<IGroup>();

  useEffect(() => {
    if (groups) {
      for (const g in groups) {
        setGroup(groups[g]);
        break;
      }
    }
    if (groupSchedules) {
      for (const g in groupSchedules) {
        setNewSchedule(g);
        break;
      }
    }
  }, [groups, groupSchedules]);

  useEffect(() => {
    if (!group?.name) return;
    const [abort1] = api(GET_GROUP_SERVICES, true, { groupName: group.name });
    const [abort2] = api(GET_GROUP_SCHEDULES, false, { groupName: group.name });
    const [abort3] = api(GET_SCHEDULES);
    return () => {
      abort1();
      abort2();
      abort3();
    }
  }, [group]);

  const setNewSchedule = useCallback((scheduleId: string) => {
    const sched = groupSchedules[scheduleId];
    sched.scheduleTimeUnitName = timeUnits.find(u => u.id === sched.scheduleTimeUnitId)?.name as ITimeUnitNames;
    sched.bracketTimeUnitName = timeUnits.find(u => u.id === sched.bracketTimeUnitId)?.name as ITimeUnitNames;
    sched.slotTimeUnitName = timeUnits.find(u => u.id === sched.slotTimeUnitId)?.name as ITimeUnitNames;
    setSchedule({ ...groupSchedules[scheduleId], brackets: {} });
  }, [groupSchedules])

  return <>

    <ManageScheduleBrackets
      schedules={schedules}
      groupServices={groupServices}
      groupSchedules={groupSchedules}
      postScheduleAction={POST_SCHEDULE}
      postScheduleParentAction={POST_SCHEDULE_PARENT}
      getScheduleBracketsAction={GET_SCHEDULES}
      postScheduleBracketsAction={POST_SCEHDULE_BRACKETS}
    />

    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <CardHeader
            title="Create Schedule Bracket"
            subheader='A bracket determines when you will be available during a schedule. The schedule determines how long the bracket can be. '
            action={
              groups && group?.id && <TextField
                select
                value={group.id}
                label="Group"
                onChange={e => setGroup(groups[e.target.value])}
              >
                {Object.values(groups || {}).map(group => <MenuItem key={`group-select${group.id}`} value={group.id}>{group.name}</MenuItem>)}
              </TextField>
            }
          />
          <CardContent sx={{ padding: '0 15px' }}>
            <Grid container>
              <Grid item xs={12} md={6}>
                {/* <ul>
                <li><Typography variant="caption">Alice works <strong>40 hours per week</strong>, meets with clients in <strong>30 minute slots</strong>, and charges a single rate. <br /> - <strong>40 hours, 30 minute booking slot, 1x multiplier</strong></Typography></li>
                <li><Typography variant="caption">Rick works <strong>10 days per month</strong>, but charges more after the first 7 days. <br /> - 2 brackets: <strong>7 days, 1x multiplier</strong>, and <strong>3 days, 2x multiplier</strong>.</Typography></li>
              </ul> */}


                
              </Grid>
            </Grid>

          </CardContent>
        </Card>
      </Grid>
    </Grid>
  </>
}

export default ScheduleHome;