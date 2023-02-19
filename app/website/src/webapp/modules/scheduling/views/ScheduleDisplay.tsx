import React, { createRef, CSSProperties, useCallback, useMemo, useState } from 'react';
import moment from 'moment';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Button from '@mui/material/Button';
import { FixedSizeGrid } from 'react-window';

import { ISchedule, IScheduleBracket, IScheduleBracketSlot, ITimeUnitNames, TimeUnit, timeUnitOrder } from 'awayto';

export type ScheduleDisplayProps = {
  schedule?: ISchedule;
  setSchedule?(value: ISchedule): void;
};

type GridCell = {
  columnIndex: number, rowIndex: number, style: CSSProperties
}

declare global {
  interface IProps extends ScheduleDisplayProps { }
}

const bracketColors = ['red', 'green', 'blue', 'pink'];

export default function ScheduleDisplay({ schedule, setSchedule }: IProps & Required<ScheduleDisplayProps>) {

  const [selected, setSelected] = useState({} as Record<string, IScheduleBracketSlot>);
  const [selectedBracket, setSelectedBracket] = useState<IScheduleBracket>(schedule.brackets[0]);
  const [buttonDown, setButtonDown] = useState(false);

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
    const target = `schedule_selection_${props.columnIndex}_${props.rowIndex}`;
    const exists = selected[target];
    const startTime = moment().startOf(xAxisTypeName as moment.unitOfTime.Base).add(slotDuration * props.rowIndex, slotTimeUnitName);

    const setValue = function() {
      const bracket = schedule.brackets.find(b => b.id === selectedBracket.id) as IScheduleBracket;

      const slot = {
        id: (new Date()).getTime().toString(),
        startTime: startTime.utc().toString(),
        bracketId: selectedBracket.id
      };

      if (exists) {
        bracket.slots = bracket.slots.filter(b => b.id !== exists.id);
        delete selected[target];
      } else if (Object.values(selected).filter(s => s.bracketId === selectedBracket.id).length < selectedBracket.duration) {
        bracket.slots.push(slot)
        selected[target] = slot;
      } else {
        alert('you went over your allotment');
      }

      setSchedule({ ...schedule, brackets: [...schedule.brackets] });
      setSelected({ ...selected });
    }

    return <CardActionArea
      style={props.style}
      sx={{ position: 'relative', '&:hover': { opacity: '1', boxShadow: '2' }, border: exists ? `1px solid ${bracketColors[schedule.brackets.findIndex(b => b.id === exists.bracketId)]}` : undefined, backgroundColor: '#444', opacity: !exists ? '.33' : '1', textAlign: 'center', boxShadow: exists ? '2' : undefined }}
      onMouseLeave={() => buttonDown && setValue()}
      onMouseDown={() => setButtonDown(true)}
      onMouseUp={() => {
        setButtonDown(false);
        setValue();
      }}
    >
      {moment.weekdaysShort()[props.columnIndex]}  {startTime.format("hh:mm A")}
    </CardActionArea>
  }, [selected, buttonDown, selectedBracket, slotTimeUnitName, slotDuration, xAxisTypeName]);

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
      <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {schedule.brackets.map((bracket, i) => {
          return <Box key={`bracket-chip${i + 1}new`} m={1}>
            <Chip
              label={`#${i + 1} ${bracket.duration - Object.values(selected).filter(s => s.bracketId === bracket.id).length} ${schedule.bracketTimeUnitName as ITimeUnitNames} (${bracket.multiplier}x)`}
              sx={{ '&:hover': { cursor: 'pointer' }, borderWidth: '1px', borderStyle: 'solid', borderColor: bracketColors[i], boxShadow: selectedBracket?.id === bracket.id ? 2 : undefined }}
              onDelete={() => {
                setSchedule({ ...schedule, brackets: schedule.brackets?.filter((_, z) => i !== z) });
              }}
              onClick={() => {
                setSelectedBracket(bracket);
              }}
            />
          </Box>
        })}
      </Box>
    </Card>

    <pre>{JSON.stringify(schedule, null, 2)}</pre>
  </>;
}