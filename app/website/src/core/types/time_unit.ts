import { Period, ChronoUnit, Duration, LocalDate, nativeJs, TemporalAdjusters, LocalDateTime, ZoneId, DateTimeFormatter } from "@js-joda/core";
import { Locale, WeekFields } from "@js-joda/locale_en-us";

export type ITimeUnitNames  = 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

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
  TimeUnit.MINUTE,
  TimeUnit.HOUR,
  TimeUnit.DAY,
  TimeUnit.WEEK,
  TimeUnit.MONTH,
  TimeUnit.YEAR
] as ITimeUnitNames[];

export const chronoTimeUnits: Record<ITimeUnitNames, ChronoUnit> = {
  [TimeUnit.YEAR]: ChronoUnit.YEARS,
  [TimeUnit.MONTH]: ChronoUnit.MONTHS,
  [TimeUnit.WEEK]: ChronoUnit.WEEKS,
  [TimeUnit.DAY]: ChronoUnit.DAYS,
  [TimeUnit.HOUR]: ChronoUnit.HOURS,
  [TimeUnit.MINUTE]: ChronoUnit.MINUTES
};

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

export function utcNow() {
  return nativeJs(new Date(), ZoneId.UTC);
}

export function utcNowString() {
  return nativeJs(new Date(), ZoneId.UTC).toString();
}

export const formatter = DateTimeFormatter.ofPattern('eee, hh:mm a').withLocale(Locale.US);
const weekFields = WeekFields.of(Locale.US);
const firstDay = weekFields.firstDayOfWeek();
export const startOfWeek = LocalDate.now().with(TemporalAdjusters.previous(firstDay)).atStartOfDay();

export function getContextFormattedDuration(contextUnit: ITimeUnitNames, duration: string): string {
  let formatted = 'No format!';

  if (TimeUnit.DAY === contextUnit) {
    formatted = startOfWeek.plus(Duration.parse(duration)).format(formatter);
  } else if (TimeUnit.WEEK === contextUnit) {
    formatted = startOfWeek.plus(Duration.parse(duration)).format(formatter);
  }

  return formatted;
}
