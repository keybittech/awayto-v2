import React, { CSSProperties, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { FixedSizeGrid } from 'react-window';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';

import { getRelativeDuration, ISchedule, IScheduleBracket, IScheduleBracketSlot } from 'awayto/core';
import { useSchedule } from 'awayto/hooks';

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
  
  const getScheduleData = useSchedule();
  const parentRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState({} as Record<string, IScheduleBracketSlot>);
  const [selectedBracket, setSelectedBracket] = useState<IScheduleBracket>();
  const [buttonDown, setButtonDown] = useState(false);
  const [width, setWidth] = useState(1);

  const { scheduleTimeUnitName, bracketTimeUnitName, slotTimeUnitName, slotDuration } = schedule;
  const { divisions, durations, selections, xAxisTypeName } = useMemo(() => {
    return getScheduleData({ scheduleTimeUnitName, bracketTimeUnitName, slotTimeUnitName, slotDuration });
  }, [scheduleTimeUnitName, bracketTimeUnitName, slotTimeUnitName, slotDuration])

  const scheduleBracketsValues = useMemo(() => Object.values(schedule.brackets || {}), [schedule.brackets]);

  const setValue = useCallback((startTime: string) => {
    if (selectedBracket) {
      const bracket = schedule.brackets[selectedBracket.id];
      if (bracket) {
        if (!bracket.slots) bracket.slots = {};

        const target = `schedule_bracket_slot_selection_${startTime}`;
        const exists = selected[target];
  
        const slot = {
          id: (new Date()).getTime().toString(),
          startTime,
          scheduleBracketId: selectedBracket.id
        } as IScheduleBracketSlot;
  
        if (exists) {
          delete bracket.slots[exists.id];
          delete selected[target];
        } else if (Object.keys(bracket.slots).length * schedule.slotDuration < getRelativeDuration(selectedBracket.duration, schedule.bracketTimeUnitName, schedule.slotTimeUnitName)) {
          bracket.slots[slot.id] = slot;
          selected[target] = slot;
        } else {
          alert('you went over your allottment');
          setButtonDown(false);
          return;
        }
  
        setSchedule({ ...schedule, brackets: { ...schedule.brackets } });
        setSelected({ ...selected });
      }
    }
  }, [schedule, selectedBracket, scheduleBracketsValues, selected]);

  const Cell = useCallback((gridCell: GridCell) => {
    const { startTime, contextFormat } = durations[gridCell.columnIndex][gridCell.rowIndex];

    const target = `schedule_bracket_slot_selection_${startTime}`;    
    const exists = selected[target];

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
      onMouseLeave={() => buttonDown && setValue(startTime)}
      onMouseDown={() => setButtonDown(true)}
      onMouseUp={() => {
        setButtonDown(false);
        setValue(startTime);
      }}
    >
      {contextFormat}
    </CardActionArea>
  }, [selected, buttonDown, selectedBracket, xAxisTypeName]);

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
          if (!bracket.slots) bracket.slots = {};
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