import { IGroupSchedule, IGroupUserSchedule, IService, IServiceTier } from 'awayto/core';
import { IDefaultedComponent } from 'awayto/hooks';
import { createContext } from 'react';

declare global {
  type GroupScheduleContextType = {
    groupSchedules: IGroupSchedule[];
    groupSchedule: IGroupSchedule;
    groupUserSchedules: IGroupUserSchedule[];
    groupScheduleService: IService;
    groupScheduleServiceTier: IServiceTier;
    GroupScheduleSelect: IDefaultedComponent;
    GroupScheduleServiceSelect: IDefaultedComponent;
    GroupScheduleServiceTierSelect: IDefaultedComponent;
  }
}

export const GroupScheduleContext = createContext<GroupScheduleContextType | null>(null);

export default GroupScheduleContext;