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

  // The number of x axis divions
  const divisions = useMemo(() => {
    return moment.duration({ [scheduleTimeUnitName]: 1 }).as(xAxisTypeName)
  }, [scheduleTimeUnitName, xAxisTypeName]);

  // The number of divided bracket duration elements per column
  const selections = useMemo(() => {
    return moment.duration({ [xAxisTypeName]: 1 }).as(yAxisTypeName) / slotDuration;
  }, [xAxisTypeName, yAxisTypeName, slotDuration]);

  const scheduleBracketsValues = useMemo(() => Object.values(schedule.brackets), [schedule.brackets]);

  const Cell = useCallback((props: GridCell) => {
    const startTime = moment().startOf(xAxisTypeName).startOf(scheduleTimeUnitName).add(slotDuration * props.rowIndex, slotTimeUnitName).add(props.columnIndex, xAxisTypeName);

    const target = `schedule_bracket_slot_selection_${startTime.utc().local().toISOString()}`;
    const exists = selected[target];
    const weekLabel = TimeUnit.WEEK === xAxisTypeName ? `W${Math.ceil(startTime.date() / 7)}` : '';

    const setValue = useCallback(function () {
      if (selectedBracket) {
        const bracket = schedule.brackets[selectedBracket.id];

        const slot = {
          id: (new Date()).getTime().toString(),
          startTime: startTime.toISOString(),
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
      {weekLabel} {startTime.format('ddd hh:mm A')}
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
    if (Object.keys(selected).length && scheduleBracketsValues.some(b => !Object.keys(b.slots).length)) {
      setSelected({});
    } else if (!Object.keys(selected).length && scheduleBracketsValues.some(b => Object.keys(b.slots).length)) {
      const newSelected = {} as Record<string, IScheduleBracketSlot>;
      scheduleBracketsValues.forEach(b => {
        Object.values(b.slots).forEach(s => {
          newSelected[`schedule_bracket_slot_selection_${moment.utc(s.startTime).local().toISOString()}`] = s;
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
    {/* <Grid item xs={12} sx={{ maxHeight: '600px', overflow: 'auto' }}>
          <Typography variant="h6">Selected Slots</Typography>
          {scheduleBracketsValues.map((b, i) => {
            const slots = Object.values(b.slots);
            return <Box key={`selected_bracket_slot_display_${i}`}>
              <Typography>Bracket #{i + 1} - {slots.length * schedule.slotDuration} {schedule.slotTimeUnitName}s</Typography>
              {slots.sort((a, b) => moment(a.startTime).milliseconds() - moment(b.startTime).milliseconds()).map((s, z) => {
                const weekLabel = TimeUnit.WEEK === xAxisTypeName ? `W${Math.ceil(moment(s.startTime).date() / 7)}` : '';
                return <Box key={`selected_slot_display_${z}`}>
                  {weekLabel} {moment(s.startTime).format('ddd hh:mm A')}
                </Box>
              })}
            </Box>
          })}
        </Grid> */}
  </>;
}