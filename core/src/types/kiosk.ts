import { IGroup } from './group';
import { ISchedule } from './schedule';

export type IKiosk = IGroup & {
  schedules: Record<string, ISchedule>;
  updatedOn: string;
}