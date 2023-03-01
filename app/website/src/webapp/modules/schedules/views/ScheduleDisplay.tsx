import React, { CSSProperties, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Duration } from '@js-joda/core';
import { FixedSizeGrid } from 'react-window';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';

import { chronoTimeUnits, getContextFormattedDuration, getRelativeDuration, ISchedule, IScheduleBracket, IScheduleBracketSlot, TimeUnit, timeUnitOrder } from 'awayto';

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

const bracketColors = ['cadetblue', 'brown', 'chocolate', 'forestgreen', 'darkslateblue', 'goldenrod', 'indianred', 'teal'];

export default function ScheduleDisplay({ schedule, setSchedule }: IProps & Required<ScheduleDisplayProps>): JSX.Element {
  
  const columnWidth = 150;
  
  const parentRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState({} as Record<string, IScheduleBracketSlot>);
  const [selectedBracket, setSelectedBracket] = useState<IScheduleBracket>();
  const [buttonDown, setButtonDown] = useState(false);
  const [width, setWidth] = useState(1);
  
  const { scheduleTimeUnitName, bracketTimeUnitName, slotTimeUnitName, slotDuration } = schedule;

  const xAxisTypeName = timeUnitOrder[timeUnitOrder.indexOf(scheduleTimeUnitName) - 1];
  const yAxisTypeName = slotTimeUnitName == bracketTimeUnitName ? bracketTimeUnitName : slotTimeUnitName;
  
  
  const chronoXAxisUnit = chronoTimeUnits[xAxisTypeName];
  const chronoYAxisUnit = chronoTimeUnits[yAxisTypeName];


  // The number of x axis divions
  const divisions = useMemo(() => getRelativeDuration(1, scheduleTimeUnitName, xAxisTypeName), [scheduleTimeUnitName, xAxisTypeName]);

  // The number of divided bracket duration elements per column
  const selections = useMemo(() => getRelativeDuration(1, xAxisTypeName, yAxisTypeName) / slotDuration, [xAxisTypeName, yAxisTypeName, slotDuration]);

  const scheduleBracketsValues = useMemo(() => Object.values(schedule.brackets), [schedule.brackets]);

  const Cell = useCallback((gridCell: GridCell) => {

    let cellDuration = Duration.ZERO;
    
    if (TimeUnit.WEEK === xAxisTypeName) {
      cellDuration = cellDuration.plus(gridCell.columnIndex*7, chronoTimeUnits[TimeUnit.DAY]);
    } else {
      cellDuration = cellDuration.plus(gridCell.columnIndex, chronoXAxisUnit);
    }

    cellDuration = cellDuration.plus(slotDuration * gridCell.rowIndex, chronoYAxisUnit);
    
    const cellTime = cellDuration.toString();
    const target = `schedule_bracket_slot_selection_${cellTime}`;    
    const exists = selected[target];

    const setValue = useCallback(function () {
      if (selectedBracket) {
        const bracket = schedule.brackets[selectedBracket.id];

        const slot = {
          id: (new Date()).getTime().toString(),
          startTime: cellTime,
          scheduleBracketId: selectedBracket.id
        } as IScheduleBracketSlot;

        if (exists) {
          delete bracket.slots[exists.id];
          delete selected[target];
        } else if ((Object.keys(bracket.slots).length * schedule.slotDuration) < getRelativeDuration(selectedBracket.duration, schedule.bracketTimeUnitName, schedule.slotTimeUnitName)) {
          bracket.slots[slot.id] = slot;
          selected[target] = slot;
        } else {
          alert('you went over your allottment');
        }

        setSchedule({ ...schedule, brackets: { ...schedule.brackets } });
        setSelected({ ...selected });
      }
    }, [schedule.brackets, selectedBracket, scheduleBracketsValues, selected]);

    return <CardActionArea
      style={gridCell.style}
      sx={{
        backgroundColor: '#444',
        textAlign: 'center',
        position: 'relative',
        '&:hover': {
          backgroundColor: '#aaa',
          opacity: '1',
          boxShadow: '2'
        },
        border: exists ? `1px solid ${bracketColors[scheduleBracketsValues.findIndex(b => b.id === exists.scheduleBracketId)]}` : undefined,
        opacity: !exists ? '.33' : '1',
        boxShadow: exists ? '2' : undefined
      }}
      onMouseLeave={() => buttonDown && setValue()}
      onMouseDown={() => setButtonDown(true)}
      onMouseUp={() => {
        setButtonDown(false);
        setValue();
      }}
    >
      {getContextFormattedDuration(xAxisTypeName, cellTime)}
    </CardActionArea>
  }, [selected, buttonDown, selectedBracket, slotTimeUnitName, slotDuration, xAxisTypeName]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(([event]) => {
      setWidth(event.contentBoxSize[0].inlineSize);
    });

    if (parentRef && parentRef.current) {
      resizeObserver.observe(parentRef.current);
    }
  }, [parentRef]);

  useEffect(() => {
    if (!Object.keys(selected).length && scheduleBracketsValues.some(b => Object.keys(b.slots).length)) {
      const newSelected = {} as Record<string, IScheduleBracketSlot>;
      scheduleBracketsValues.forEach(b => {
        Object.values(b.slots).forEach(s => {
          newSelected[`schedule_bracket_slot_selection_${s.startTime}`] = s;
        });
      });
      setSelected(newSelected);
    }
  }, [selected, scheduleBracketsValues]);

  return <>
    <Typography variant="caption">Click a bracket, then use up the allotted time by clicking on the time slots. Hold down the mouse button to select multiple slots. There can be leftover slots if they're unneeded.</Typography>
    <Box ref={parentRef}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {scheduleBracketsValues.map((bracket, i) => {
          return <Box key={`bracket-chip${i + 1}new`} m={1}>
            <Chip
              label={`#${i + 1} ${getRelativeDuration(bracket.duration, schedule.bracketTimeUnitName, schedule.slotTimeUnitName) - (Object.keys(bracket.slots).length * schedule.slotDuration)} ${schedule.slotTimeUnitName}s (${bracket.multiplier}x)`}
              sx={{ '&:hover': { cursor: 'pointer' }, borderWidth: '1px', borderStyle: 'solid', borderColor: bracketColors[i], boxShadow: selectedBracket?.id === bracket.id ? 2 : undefined }}
              onDelete={() => {
                delete schedule.brackets[bracket.id];
                setSchedule({ ...schedule, brackets: { ...schedule.brackets } });
              }}
              onClick={() => {
                setSelectedBracket(bracket);
              }}
            />
          </Box>
        })}
      </Box>

      <Box onMouseLeave={() => setButtonDown(false)}>
        <FixedSizeGrid
          rowCount={selections}
          columnCount={divisions}
          rowHeight={30}
          columnWidth={columnWidth}
          height={400}
          width={Math.min(width, columnWidth * divisions)}
        >
          {Cell}
        </FixedSizeGrid>
      </Box>
    </Box>
  </>;
}