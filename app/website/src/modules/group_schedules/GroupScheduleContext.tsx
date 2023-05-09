import { createContext } from 'react';
import { IGroupSchedule, IService, IServiceTier } from 'awayto/core';
import { SiteEndpointDefinitions, UseSelectOneResponse } from 'awayto/hooks';
import { UseQueryHookResult } from '@reduxjs/toolkit/dist/query/react/buildHooks';

declare global {
  type GroupScheduleContextType = {
    getGroupSchedules: UseQueryHookResult<SiteEndpointDefinitions['getGroupSchedules']>;
    getGroupUserScheduleStubs: UseQueryHookResult<SiteEndpointDefinitions['getGroupUserScheduleStubs']>;
    getGroupUserSchedules: UseQueryHookResult<SiteEndpointDefinitions['getGroupUserSchedules']>;
    selectGroupSchedule: UseSelectOneResponse<IGroupSchedule>;
    selectGroupScheduleService: UseSelectOneResponse<IService>;
    selectGroupScheduleServiceTier: UseSelectOneResponse<IServiceTier>;
  }
}

export const GroupScheduleContext = createContext<GroupScheduleContextType | null>(null);

export default GroupScheduleContext;