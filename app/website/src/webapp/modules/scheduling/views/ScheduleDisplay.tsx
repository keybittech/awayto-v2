import React, { useMemo, useRef } from 'react';
import moment from 'moment';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';

import { ISchedule, timeUnitOrder } from 'awayto';

export type ScheduleDisplayProps = {
  schedule?: ISchedule
};

declare global {
  interface IProps extends ScheduleDisplayProps { }
}

export default function ScheduleDisplay({ schedule }: IProps & Required<ScheduleDisplayProps>) {
  const { id, name, scheduleTimeUnitId, scheduleTimeUnitName, duration, brackets } = schedule;
  const subdivision = timeUnitOrder[timeUnitOrder.indexOf(scheduleTimeUnitName!)-1]
  const ScheduleElement = useRef<HTMLElement>();

  const scheduleDisplay = useMemo(() => {
    const divisions = moment.duration({ [scheduleTimeUnitName!]: 1 }).as(subdivision as moment.unitOfTime.Base)
    console.log({ divisions });

    // const subdivided = scheduleTimeUnitName !== slotTimeUnitName;
    // const duration = !subdivided ? bracketDuration : Math.round(moment.duration({ [scheduleTimeUnitName]: 1 }).as(slotTimeUnitName as moment.unitOfTime.Base));




    const DivisionElements = [] as JSX.Element[];
    for (let i = 0; i < divisions; i++) {
      DivisionElements.push(
        <Grid  item xs={1} sx={{ display: 'flex' }} justifyContent="center" key={`${i}_schedule_display_column`}>
          test
        </Grid>
      )
    }


    return <>
      <Grid container direction="row" justifyContent="space-between" columns={divisions}>
        {DivisionElements}
      </Grid>
    </>
  }, [scheduleTimeUnitName, duration, subdivision]);  

  return <>
    {scheduleDisplay}
    <pre>{JSON.stringify(schedule, null, 2)}</pre>
  </>;
}