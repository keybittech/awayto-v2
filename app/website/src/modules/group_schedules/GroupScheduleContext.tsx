import { createContext } from 'react';
import { IGroupSchedule, IGroupUserSchedule, IService, IServiceTier } from 'awayto/core';
import { IDefaultedComponent } from 'awayto/hooks';

declare global {
  type GroupScheduleContextType = {
    groupSchedules: IGroupSchedule[];
    groupUserSchedules: IGroupUserSchedule[];
    groupSchedule?: IGroupSchedule;
    setGroupScheduleId: (id: string) => void;
    groupScheduleService?: IService;
    setGroupScheduleServiceId: (id: string) => void;
    groupScheduleServiceTier?: IServiceTier;
    setGroupScheduleServiceTierId: (id: string) => void;
    GroupScheduleSelect: IDefaultedComponent;
    GroupScheduleServiceSelect: IDefaultedComponent;
    GroupScheduleServiceTierSelect: IDefaultedComponent;
  }
}

export const GroupScheduleContext = createContext<GroupScheduleContextType | null>(null);

export default GroupScheduleContext;