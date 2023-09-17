import React, { useContext, useMemo } from 'react';

import { sh, useComponents, useContexts, useSelectOne } from 'awayto/hooks';

export function GroupScheduleProvider({ children }: IProps): React.JSX.Element {
  const { GroupScheduleSelectionProvider } = useComponents();

  const { GroupScheduleContext } = useContexts();

  const getGroupSchedules = sh.useGetGroupSchedulesQuery();
  const getGroupUserScheduleStubs = sh.useGetGroupUserScheduleStubsQuery();
  const selectGroupSchedule = useSelectOne('Schedule', { data: getGroupSchedules.data });
  const getGroupUserSchedules = sh.useGetGroupUserSchedulesQuery({ groupScheduleId: selectGroupSchedule.item?.id || '' }, { skip: !selectGroupSchedule.item });
  const selectGroupScheduleService = useSelectOne('Service', { data: getGroupUserSchedules.data?.flatMap(gus => Object.values(gus.brackets).flatMap(b => Object.values(b.services))) });
  const selectGroupScheduleServiceTier = useSelectOne('Tier', { data: Object.values(selectGroupScheduleService.item?.tiers || {}).sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime()) });

  const groupScheduleContext = {
    getGroupSchedules,
    getGroupUserScheduleStubs,
    selectGroupSchedule,
    getGroupUserSchedules,
    selectGroupScheduleService,
    selectGroupScheduleServiceTier
  } as GroupScheduleContextType | null;

  return useMemo(() => !GroupScheduleContext ? <></> :
    <GroupScheduleContext.Provider value={groupScheduleContext}>
      <GroupScheduleSelectionProvider>
        {children}
      </GroupScheduleSelectionProvider>
    </GroupScheduleContext.Provider>,
    [GroupScheduleContext, groupScheduleContext]
  );
}

export default GroupScheduleProvider;