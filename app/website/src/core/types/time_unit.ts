import dayjs from "dayjs";

export type ITimeUnitNames = string | ('minute' | 'hour' | 'day' | 'week' | 'month' | 'year');

export enum TimeUnit {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year'
}

export type ITimeUnit = {
  id: string;
  name: ITimeUnitNames;
};

export const timeUnitOrder = [
  'minute',
  'hour',
  'day',
  'week',
  'month',
  'year'
] as ITimeUnitNames[];

export const millisTimeUnits: Record<ITimeUnitNames, number> = {
  [TimeUnit.YEAR]: 31536000000,
  [TimeUnit.MONTH]: 2629800000,
  [TimeUnit.WEEK]: 604800000,
  [TimeUnit.DAY]: 86400000,
  [TimeUnit.HOUR]: 3600000,
  [TimeUnit.MINUTE]: 60000
}

export function getRelativeDuration(amount: number, fromUnit: ITimeUnitNames, toUnit: ITimeUnitNames): number {
  const fromDuration = millisTimeUnits[fromUnit];
  const toDuration = millisTimeUnits[toUnit];
  return (amount * fromDuration) / toDuration;
}

export function utcNow(): dayjs.Dayjs {
  return dayjs().utc();
}

export function utcNowString(): string {
  return dayjs().utc().toString();
}

export const compactDateTimeFormat = 'ddd, hh:mm a';
export const currentStartOfWeek = dayjs().startOf('week').startOf('day');

export function getContextFormattedDuration(contextUnit: ITimeUnitNames | string, duration: string, relativeDate: dayjs.Dayjs = currentStartOfWeek): string {
  let formatted = 'No format!';

  if (TimeUnit.DAY === contextUnit) {
    formatted = relativeDate.add(dayjs.duration(duration)).format(compactDateTimeFormat);
  } else if (TimeUnit.WEEK === contextUnit) {
    formatted = relativeDate.add(dayjs.duration(duration)).format(compactDateTimeFormat);
  }

  return formatted;
}