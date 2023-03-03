import { useCallback, useMemo } from "react";

import { getContextFormattedDuration, getRelativeDuration, ISchedule, IScheduleBracketSlot, timeUnitOrder } from "awayto";
import dayjs from "dayjs";
import { DurationUnitType } from "dayjs/plugin/duration";

type UseScheduleProps = {
  scheduleTimeUnitName: string;
  bracketTimeUnitName: string;
  slotTimeUnitName: string;
  slotDuration: number;
  bracketSlots?: Record<string, IScheduleBracketSlot>;
  beginningOfMonth?: dayjs.Dayjs;
};

type CellDuration = {
  x: number;
  y: number;
  startTime: string;
  active: boolean;
  contextFormat: string;
}

type UseScheduleResult = {
  xAxisTypeName: string;
  yAxisTypeName: string;
  divisions: number;
  selections: number;
  durations: CellDuration[][]
}

export function useSchedule(): (schedule: UseScheduleProps) => UseScheduleResult {

  const getScheduleData = useCallback(({ scheduleTimeUnitName, bracketTimeUnitName, slotTimeUnitName, slotDuration, beginningOfMonth }: UseScheduleProps) => {
    console.time("GENERATING_SCHEDULE");
    
    const xAxisTypeName = timeUnitOrder[timeUnitOrder.indexOf(scheduleTimeUnitName) - 1];
    const yAxisTypeName = slotTimeUnitName == bracketTimeUnitName ? bracketTimeUnitName : slotTimeUnitName;
    const divisions = beginningOfMonth ? beginningOfMonth.daysInMonth() : getRelativeDuration(1, scheduleTimeUnitName, xAxisTypeName);
    const selections = getRelativeDuration(1, xAxisTypeName, yAxisTypeName) / slotDuration;
    const durations = [] as CellDuration[][];

    for (let x = 0; x < divisions; x++) {
      durations[x] = [] as CellDuration[];
      for (let y = 0; y < selections; y++) {
        const duration = dayjs.duration(0)
          .add(x, xAxisTypeName as DurationUnitType)
          .add(slotDuration * y, yAxisTypeName as DurationUnitType)
          .toISOString();

        const cell = {
          x,
          y,
          startTime: duration,
          contextFormat: getContextFormattedDuration(xAxisTypeName, duration, beginningOfMonth),
          active: false
        };

        durations[x][y] = cell;
      }
    }
    console.timeEnd("GENERATING_SCHEDULE");

    return {
      xAxisTypeName,
      yAxisTypeName,
      divisions,
      selections,
      durations
    };
  }, []);

  return getScheduleData;
}