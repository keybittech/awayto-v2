import { IGroupSchedule, IGroupUserSchedule, IService, IServiceTier } from 'awayto/core';
import { IBaseComponent } from 'awayto/hooks';
import { createContext } from 'react';

declare global {
  type GroupScheduleContextType = {
    groupSchedules: IGroupSchedule[];
    groupSchedule: IGroupSchedule;
    groupUserSchedules: IGroupUserSchedule[];
    groupScheduleService: IService;
    groupScheduleServiceTier: IServiceTier;
    GroupScheduleSelect: React.LazyExoticComponent<IBaseComponent> | (() => JSX.Element);
    GroupScheduleServiceSelect: React.LazyExoticComponent<IBaseComponent> | (() => JSX.Element);
    GroupScheduleServiceTierSelect: React.LazyExoticComponent<IBaseComponent> | (() => JSX.Element);
    GroupScheduleDatePicker: React.LazyExoticComponent<IBaseComponent> | (() => JSX.Element);
    GroupScheduleTimePicker: React.LazyExoticComponent<IBaseComponent> | (() => JSX.Element);
  }
}

export const GroupScheduleContext = createContext<GroupScheduleContextType | null>(null);

export default GroupScheduleContext;