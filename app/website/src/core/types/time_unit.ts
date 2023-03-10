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

export function plural(n: number, singular: string, plural: string): string {
  return n.toString() + ' ' + (n === 1 ? singular: plural);
}

export function staticDT(weekStart: dayjs.Dayjs, startTime:string): dayjs.Dayjs {
  const d = dayjs.duration(startTime);
  return weekStart.day(d.days()).hour(d.hours()).minute(d.minutes());
}

export function quotedDT(weekStart: string, startTime: string): dayjs.Dayjs {
  return staticDT(dayjs(weekStart), startTime);
}

export function bookingDT(slotDate: string, startTime: string): dayjs.Dayjs {
  return staticDT(dayjs(slotDate).startOf('day').startOf('week'), startTime);
}

export function bookingDTHours(slotDate: string, startTime: string): string {
  return bookingDT(slotDate, startTime).format("hh:mm a");
}

export function shortNSweet(slotDate: string, startTime: string): string {
  return `${dayjs(slotDate).format("ddd, MMM D")} at ${bookingDTHours(slotDate, startTime)}`;
}

export function utcDTLocal(utc: string): string {
  return dayjs.utc(utc).local().format("YYYY-MM-DD hh:mm a");
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