import React, { CSSProperties, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import moment from 'moment';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
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

const bracketColors = ['cadetblue', 'brown', 'chocolate', 'forestgreen', 'darkslateblue', 'goldenrod', 'indianred', 'teal'];

export default function ScheduleDisplay({ schedule, setSchedule }: IProps & Required<ScheduleDisplayProps>) {

  const [selected, setSelected] = useState({} as Record<string, IScheduleBracketSlot>);
  const [selectedBracket, setSelectedBracket] = useState<IScheduleBracket>();
  const [buttonDown, setButtonDown] = useState(false);
  const [width, setWidth] = useState(1);
  const parentRef = useRef<HTMLDivElement>(null);

  const { scheduleTimeUnitName, bracketTimeUnitName, slotTimeUnitName, slotDuration } = schedule;

  const xAxisTypeName = timeUnitOrder[timeUnitOrder.indexOf(scheduleTimeUnitName) - 1];
  const yAxisTypeName = slotTimeUnitName == bracketTimeUnitName ? bracketTimeUnitName : slotTimeUnitName;
  const columnWidth = 150;

  useEffect(() => {
    if (schedule.brackets) {
      for (const b in schedule.brackets) {
        setSelectedBracket(schedule.brackets[b]);
        break;
      }
    }
  }, [schedule.brackets]);

  // THe number of x axis divions
  const divisions = useMemo(() => {
    return moment.duration({ [scheduleTimeUnitName]: 1 }).as(xAxisTypeName)
  }, [scheduleTimeUnitName, xAxisTypeName]);

  // The number of divided bracket duration elements per column
  const selections = useMemo(() => {
    return moment.duration({ [xAxisTypeName]: 1 }).as(yAxisTypeName) / slotDuration;
  }, [xAxisTypeName, yAxisTypeName, slotDuration]);

  const scheduleBracketsValues = useMemo(() => Object.values(schedule.brackets), [schedule.brackets]);

  const Cell = useCallback((props: GridCell) => {
    const target = `schedule_selection_${props.columnIndex}_${props.rowIndex}`;
    const exists = selected[target];
    const startTime = moment().startOf(xAxisTypeName).add(slotDuration * props.rowIndex, slotTimeUnitName).add(props.columnIndex, xAxisTypeName);

    const setValue = useCallback(function () {
      if (selectedBracket) {
        const bracket = schedule.brackets[selectedBracket.id];
  
        const slot = {
          id: (new Date()).getTime().toString(),
          startTime: startTime.format('ddd hh:mm A'),
          scheduleBracketId: selectedBracket.id
        } as IScheduleBracketSlot;
  
        if (exists) {
          delete bracket.slots[exists.id];
          delete selected[target];
        } else if ((Object.keys(bracket.slots).length * schedule.slotDuration) < moment.duration({ [schedule.bracketTimeUnitName]: selectedBracket.duration }).as(schedule.slotTimeUnitName)) {
          bracket.slots[slot.id] = slot;
          selected[target] = slot;
        } else {
          alert('you went over your allottment');
        }
  
        setSchedule({ ...schedule, brackets: { ...schedule.brackets } });
        setSelected({ ...selected });
      }
    }, [schedule.brackets, selectedBracket, scheduleBracketsValues, selected]);

    useEffect(() => {
      const resizeObserver = new ResizeObserver(([event]) => {
        setWidth(event.contentBoxSize[0].inlineSize);
      });

      if (parentRef && parentRef.current) {
        resizeObserver.observe(parentRef.current);
      }
    }, [parentRef]);

    useEffect(() => {
      if (Object.keys(selected).length && 0 === Object.keys(scheduleBracketsValues[0].slots).length) {
        setSelected({});
      }
    }, [selected, scheduleBracketsValues])

    return <CardActionArea
      style={props.style}
      sx={{ position: 'relative', '&:hover': { opacity: '1', boxShadow: '2' }, border: exists ? `1px solid ${bracketColors[scheduleBracketsValues.findIndex(b => b.id === exists.scheduleBracketId)]}` : undefined, backgroundColor: '#444', opacity: !exists ? '.33' : '1', textAlign: 'center', boxShadow: exists ? '2' : undefined }}
      onMouseLeave={() => buttonDown && setValue()}
      onMouseDown={() => setButtonDown(true)}
      onMouseUp={() => {
        setButtonDown(false);
        setValue();
      }}
    >
      {startTime.format('ddd hh:mm A')}
    </CardActionArea>
  }, [selected, buttonDown, selectedBracket, slotTimeUnitName, slotDuration, xAxisTypeName]);

  return <>
    <Card sx={{
      backgroundColor: '#444',
      padding: '15px'
    }}
    >
      <Grid container>
        <Grid item xs={12} sm={8} ref={parentRef}>
          <Typography variant="h6">Schedule Display</Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {scheduleBracketsValues.map((bracket, i) => {
              return <Box key={`bracket-chip${i + 1}new`} m={1}>
                <Chip
                  label={`#${i + 1} ${moment.duration({ [schedule.bracketTimeUnitName]: bracket.duration }).as(schedule.slotTimeUnitName) - (Object.keys(bracket.slots).length * schedule.slotDuration)} ${schedule.slotTimeUnitName}s (${bracket.multiplier}x)`}
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
          <Typography variant="body1">Click a bracket tag above to select it, then use up the allotted time by clicking on the time slots. Hold down the mouse button to select multiple slots. There can be leftover slots if they're unneeded.</Typography>

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
        </Grid>
        <Grid item xs={12} sm={4} sx={{ maxHeight: '600px', overflow: 'auto' }}>
          <Typography variant="h6">Selected Slots</Typography>
          {scheduleBracketsValues.map((b, i) => {
            const slots = Object.values(b.slots);
            return <Box key={`selected_bracket_slot_display_${i}`}>
              <Typography>Bracket #{i + 1} - {slots.length * schedule.slotDuration} {schedule.slotTimeUnitName}s</Typography>
              {slots.sort((a, b) => moment(a.startTime).milliseconds() - moment(b.startTime).milliseconds()).map((s, z) => <Box key={`selected_slot_display_${z}`}>
                {s.startTime}
              </Box>)}
            </Box>
          })}
        </Grid>
      </Grid>
    </Card>
  </>;
}