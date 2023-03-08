import dayjs from 'dayjs';

import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

import utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

import timezone from 'dayjs/plugin/timezone';
dayjs.extend(timezone);

import 'dayjs/locale/en';

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
  return dayjs.utc(new Date());
}

export function utcNowString(): string {
  return dayjs.utc(new Date()).toISOString();
}

export const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const compactDateTimeFormat = 'ddd, hh:mm a';

export function getContextFormattedDuration(contextUnit: ITimeUnitNames | string, duration: string, relativeDate: dayjs.Dayjs = dayjs()): string {
  let formatted = 'No format!';

  if (TimeUnit.DAY === contextUnit) {
    formatted = relativeDate.startOf('week').startOf('day').add(dayjs.duration(duration)).format(compactDateTimeFormat);
  } else if (TimeUnit.WEEK === contextUnit) {
    formatted = relativeDate.startOf('week').startOf('day').add(dayjs.duration(duration)).format(compactDateTimeFormat);
  }

  return formatted;
}