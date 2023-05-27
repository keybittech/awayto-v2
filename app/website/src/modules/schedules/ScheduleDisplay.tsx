import React, { CSSProperties, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { FixedSizeGrid } from 'react-window';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';

import { deepClone, getRelativeDuration, ISchedule, IScheduleBracket, IScheduleBracketSlot } from 'awayto/core';
import { useSchedule, useTimeName } from 'awayto/hooks';

export type ScheduleDisplayProps = {
  schedule?: ISchedule;
  setSchedule?(value: ISchedule): void;
  isKiosk?: boolean;
};

type GridCell = {
  columnIndex: number, rowIndex: number, style: CSSProperties
}

declare global {
  interface IProps extends ScheduleDisplayProps { }
}

const bracketColors = ['cadetblue', 'brown', 'chocolate', 'forestgreen', 'darkslateblue', 'goldenrod', 'indianred', 'teal'];

export default function ScheduleDisplay({ isKiosk, schedule, setSchedule }: IProps & Required<ScheduleDisplayProps>): React.JSX.Element {

  const scheduleDisplay = useMemo(() => deepClone(schedule), [schedule]);
  
  const columnWidth = 150;
  
  const getScheduleData = useSchedule();
  const parentRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState({} as Record<string, IScheduleBracketSlot>);
  const [selectedBracket, setSelectedBracket] = useState<IScheduleBracket>();
  const [buttonDown, setButtonDown] = useState(false);
  const [width, setWidth] = useState(1);

  const scheduleTimeUnitName = scheduleDisplay.scheduleTimeUnitName || useTimeName(scheduleDisplay.scheduleTimeUnitId);
  const bracketTimeUnitName = scheduleDisplay.bracketTimeUnitName || useTimeName(scheduleDisplay.bracketTimeUnitId);
  const slotTimeUnitName = scheduleDisplay.slotTimeUnitName || useTimeName(scheduleDisplay.slotTimeUnitId);
  
  const { divisions, durations, selections, xAxisTypeName } = useMemo(() => {
    return getScheduleData({ scheduleTimeUnitName, bracketTimeUnitName, slotTimeUnitName, slotDuration: scheduleDisplay.slotDuration });
  }, [scheduleTimeUnitName, bracketTimeUnitName, slotTimeUnitName, scheduleDisplay.slotDuration])

  const scheduleBracketsValues = useMemo(() => Object.values(scheduleDisplay.brackets || {}), [scheduleDisplay.brackets]);

  const setValue = useCallback((startTime: string) => {
    if (selectedBracket) {
      const bracket = scheduleDisplay.brackets[selectedBracket.id];
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
        } else if (Object.keys(bracket.slots).length * scheduleDisplay.slotDuration < getRelativeDuration(selectedBracket.duration, scheduleDisplay.bracketTimeUnitName, scheduleDisplay.slotTimeUnitName)) {
          bracket.slots[slot.id] = slot;
          selected[target] = slot;
        } else {
          alert('you went over your allottment');
          setButtonDown(false);
          return;
        }
  
        setSchedule({ ...schedule, brackets: { ...scheduleDisplay.brackets } });
        setSelected({ ...selected });
      }
    }
  }, [schedule, selectedBracket, scheduleBracketsValues, selected]);

  const Cell = useCallback((gridCell: GridCell) => {
    const { startTime, contextFormat } = durations[gridCell.columnIndex][gridCell.rowIndex];

    const target = `schedule_bracket_slot_selection_${startTime}`;    
    const exists = selected[target];

    return <Box
      style={gridCell.style}
      sx={{
        userSelect: 'none',
        cursor: 'pointer',
        backgroundColor: exists ? '#eee' : 'white',
        textAlign: 'center',
        position: 'relative',
        '&:hover': {
          backgroundColor: '#aaa',
          opacity: '1',
          boxShadow: '2'
        },
        border: exists ? `1px solid ${bracketColors[scheduleBracketsValues.findIndex(b => b.id === exists.scheduleBracketId)]}` : undefined,
        color: !exists ? '#666' : 'black',
        boxShadow: exists ? '2' : undefined
      }}
      onMouseLeave={() => !isKiosk && buttonDown && setValue(startTime)}
      onMouseDown={() => !isKiosk && setButtonDown(true)}
      onMouseUp={() => {
        if (!isKiosk) {
          setButtonDown(false);
          setValue(startTime);
        }
      }}
    >
      {contextFormat}
    </Box>
  }, [durations, selected, scheduleBracketsValues, buttonDown, selectedBracket, xAxisTypeName]);

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
    {!isKiosk && <>
      <Typography variant="caption">Click a bracket, then use up the allotted time by clicking on the time slots. Hold down the mouse button to select multiple slots. There can be leftover slots if they're unneeded.</Typography>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        {scheduleBracketsValues.map((bracket, i) => {
          if (!bracket.slots) bracket.slots = {};
          return <Box key={`bracket-chip${i + 1}new`} m={1}>
            <Chip
              label={`#${i + 1} ${getRelativeDuration(bracket.duration, bracketTimeUnitName, slotTimeUnitName) - (Object.keys(bracket.slots).length * scheduleDisplay.slotDuration)} ${slotTimeUnitName}s (${bracket.multiplier}x)`}
              sx={{ '&:hover': { cursor: 'pointer' }, borderWidth: '1px', borderStyle: 'solid', borderColor: bracketColors[i], boxShadow: selectedBracket?.id === bracket.id ? 2 : undefined }}
              onDelete={() => {
                delete scheduleDisplay.brackets[bracket.id];
                setSchedule({ ...schedule, brackets: { ...scheduleDisplay.brackets } });
              }}
              onClick={() => {
                setSelectedBracket(bracket);
              }}
            />
          </Box>
        })}
      </Box>
    </>}

    <Box width="100%" ref={parentRef}>
      <Box onMouseLeave={() => setButtonDown(false)}>
        {!isNaN(selections) && !isNaN(divisions) && <FixedSizeGrid
          rowCount={selections}
          columnCount={divisions}
          rowHeight={30}
          columnWidth={columnWidth}
          height={400}
          width={Math.min(parentRef.current?.getClientRects()[0].width || 0, columnWidth * divisions) + 20}
        >
          {Cell}
        </FixedSizeGrid>}
      </Box>
      <Typography variant="caption">This schedule is representing 1 {scheduleTimeUnitName} of {bracketTimeUnitName}s divided by {scheduleDisplay.slotDuration} {slotTimeUnitName} blocks.</Typography>
    </Box>
  </>;
}