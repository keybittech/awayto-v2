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
  const [selectedBracket, setSelectedBracket] = useState<IScheduleBracket>(schedule.brackets[0]);
  const [buttonDown, setButtonDown] = useState(false);
  const [width, setWidth] = useState(1);
  const parentRef = useRef<HTMLDivElement>(null);

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
    const startTime = moment().startOf(xAxisTypeName as moment.unitOfTime.Base).add(slotDuration * props.rowIndex, slotTimeUnitName).add(props.columnIndex, xAxisTypeName);

    const setValue = useCallback(function () {
      const bracket = schedule.brackets.find(b => b.id === selectedBracket.id) as IScheduleBracket;

      const slot = {
        id: (new Date()).getTime().toString(),
        startTime: startTime.format('ddd hh:mm A'),
        scheduleBracketId: selectedBracket.id
      } as IScheduleBracketSlot;

      if (exists) {
        bracket.slots = bracket.slots.filter(b => b.id !== exists.id);
        delete selected[target];
      } else if ((bracket.slots.length * schedule.slotDuration) < moment.duration({ [schedule.bracketTimeUnitName as moment.unitOfTime.Base]: selectedBracket.duration}).as(schedule.slotTimeUnitName as moment.unitOfTime.Base)) {
        bracket.slots.push(slot)
        selected[target] = slot;
      } else {
        alert('you went over your allottment');
      }

      setSchedule({ ...schedule, brackets: [...schedule.brackets] });
      setSelected({ ...selected });
    }, [schedule.brackets, selected]);

    useEffect(() => {
      const resizeObserver = new ResizeObserver(e => {
        const [event] = e;
        setWidth(event.contentBoxSize[0].inlineSize);
      });

      if (parentRef && parentRef.current) {
        resizeObserver.observe(parentRef.current);
      }
    }, [parentRef]);

    useEffect(() => {
      if (Object.keys(selected).length && 0 === schedule.brackets[0].slots.length) {
        setSelected({});
      }
    }, [schedule.brackets])

    return <CardActionArea
      style={props.style}
      sx={{ position: 'relative', '&:hover': { opacity: '1', boxShadow: '2' }, border: exists ? `1px solid ${bracketColors[schedule.brackets.findIndex(b => b.id === exists.scheduleBracketId)]}` : undefined, backgroundColor: '#444', opacity: !exists ? '.33' : '1', textAlign: 'center', boxShadow: exists ? '2' : undefined }}
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
            {schedule.brackets.map((bracket, i) => {
              return <Box key={`bracket-chip${i + 1}new`} m={1}>
                <Chip
                  label={`#${i + 1} ${moment.duration({ [schedule.bracketTimeUnitName as moment.unitOfTime.Base]: bracket.duration }).as(schedule.slotTimeUnitName as moment.unitOfTime.Base) - (bracket.slots.length * schedule.slotDuration)} ${schedule.slotTimeUnitName as ITimeUnitNames}s (${bracket.multiplier}x)`}
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
          <Typography variant="body1">Click a bracket tag above to select it, then use up the allotted time by clicking on the time slots. Hold down the mouse button to select multiple slots. There can be leftover slots if they're unneeded.</Typography>

          <Box onMouseLeave={() => setButtonDown(false)}>
            <FixedSizeGrid
              rowCount={selections}
              columnCount={divisions}
              rowHeight={30}
              columnWidth={columnWidth}
              height={300}
              width={Math.min(width, columnWidth * divisions)}
            >
              {Cell}
            </FixedSizeGrid>
          </Box>
        </Grid>
        <Grid item xs={12} sm={4} sx={{ maxHeight: '450px', overflow: 'auto' }}>
          <Typography variant="h6">Selected Slots</Typography>
          {schedule.brackets.map((b, i) => <Box key={`selected_bracket_slot_display_${i}`}>
            <Typography>Bracket #{i + 1} - {b.slots.length * schedule.slotDuration} {schedule.slotTimeUnitName}s</Typography>
            {b.slots.sort((a, b) => moment(a.startTime).milliseconds() - moment(b.startTime).milliseconds()).map((s, z) => <Box key={`selected_slot_display_${z}`}>
              {s.startTime}
            </Box>)}
          </Box>)}
        </Grid>
      </Grid>
    </Card>
  </>;
}