import { createContext } from 'react';
import { IGroupSchedule, IGroupUserSchedule, IService, IServiceTier } from 'awayto/core';
import { IDefaultedComponent } from 'awayto/hooks';

declare global {
  type GroupScheduleContextType = {
    groupSchedules: IGroupSchedule[];
    groupUserSchedules: IGroupUserSchedule[];
    groupSchedule?: IGroupSchedule;
    groupScheduleService?: IService;
    groupScheduleServiceTier?: IServiceTier;
    GroupScheduleSelect: IDefaultedComponent;
    GroupScheduleServiceSelect: IDefaultedComponent;
    GroupScheduleServiceTierSelect: IDefaultedComponent;
  }
}

export const GroupScheduleContext = createContext<GroupScheduleContextType | null>(null);

export default GroupScheduleContext;