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
}

export const timeUnitOrder = [
  TimeUnit.MINUTE,
  TimeUnit.HOUR,
  TimeUnit.DAY,
  TimeUnit.WEEK,
  TimeUnit.MONTH,
  TimeUnit.YEAR
] as ITimeUnitNames[];