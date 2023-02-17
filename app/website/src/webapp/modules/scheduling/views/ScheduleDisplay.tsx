import React, { createRef, CSSProperties, useCallback, useMemo, useState } from 'react';
import moment from 'moment';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Button from '@mui/material/Button';
import { FixedSizeGrid } from 'react-window';

import { ISchedule, TimeUnit, timeUnitOrder } from 'awayto';

export type ScheduleDisplayProps = {
  schedule?: ISchedule
};

type GridCell = {
  columnIndex: number, rowIndex: number, style: CSSProperties
}

declare global {
  interface IProps extends ScheduleDisplayProps { }
}


export default function ScheduleDisplay({ schedule }: IProps & Required<ScheduleDisplayProps>) {

  const [selected, setSelected] = useState({} as Record<string, string>);

  const { scheduleTimeUnitName, bracketTimeUnitName, slotTimeUnitName, slotDuration } = schedule;

  const xAxisTypeName = timeUnitOrder[timeUnitOrder.indexOf(scheduleTimeUnitName!) - 1];
  const yAxisTypeName = slotTimeUnitName == bracketTimeUnitName ? bracketTimeUnitName : slotTimeUnitName;
  const columnWidth = 150;

  // THe number of x axis divions
  const divisions = useMemo(() => {
    return moment.duration({ [scheduleTimeUnitName!]: 1 }).as(xAxisTypeName as moment.unitOfTime.Base)
  }, [scheduleTimeUnitName, xAxisTypeName]);

  // The number of divided bracket duration elements per column
  const selections = useMemo(() => {
    return moment.duration({ [xAxisTypeName]: 1 }).as(yAxisTypeName as moment.unitOfTime.Base) / slotDuration;
  }, [xAxisTypeName, yAxisTypeName, slotDuration]);

  const Cell = useCallback((props: GridCell) => {
    const target = `selection_${props.columnIndex}_${props.rowIndex}`;
    const exists = selected[target];

    return <CardActionArea
      style={props.style}
      sx={{ position: 'relative', '&:hover': { opacity: '1', boxShadow: '2' }, backgroundColor: '#444', opacity: !exists ? '.33' : '1', textAlign: 'center', boxShadow: exists ? '2' : undefined }}
      onClick={() => {
        if (exists) {
          delete selected[target];
        } else {
          selected[target] = moment().startOf(xAxisTypeName as moment.unitOfTime.Base).add(slotDuration * props.rowIndex, slotTimeUnitName).utc().toString()
        }

        setSelected({ ...selected })
      }}
    >
      {moment.weekdaysShort()[props.columnIndex]}  {moment().startOf(xAxisTypeName as moment.unitOfTime.Base).add(slotDuration * (props.rowIndex), slotTimeUnitName).format("hh:mm A")}
    </CardActionArea>
  }, [selected, slotTimeUnitName, slotDuration, xAxisTypeName]);

  return <>
    <Card sx={{
      position: 'fixed',
      right: '24px',
      top: '20vh',
      backgroundColor: '#444',
      borderRadius: '4px 0 0 4px',
      padding: '15px'
    }}>
      <FixedSizeGrid
        rowCount={selections}
        columnCount={divisions}
        rowHeight={30}
        columnWidth={columnWidth}
        height={300}
        width={Math.min(560, columnWidth * divisions)}
      >
        {Cell}
      </FixedSizeGrid>
      <pre>{JSON.stringify(selected, null, 2)}</pre>
    </Card>

    <pre>{JSON.stringify(schedule, null, 2)}</pre>
  </>;
}