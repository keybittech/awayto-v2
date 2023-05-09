import React, { useContext, useMemo } from 'react';

import { sh, useComponents, useContexts, useSelectOne } from 'awayto/hooks';

export function GroupScheduleProvider({ children }: IProps): JSX.Element {
  const { GroupScheduleSelectionProvider } = useComponents();

  const { GroupContext, GroupScheduleContext } = useContexts();

  const { group } = useContext(GroupContext) as GroupContextType;

  const getGroupSchedules = sh.useGetGroupSchedulesQuery({ groupName: group?.name || '' }, { skip: !group });
  const getGroupUserScheduleStubs = sh.useGetGroupUserScheduleStubsQuery({ groupName: group?.name || '' }, { skip: !group });
  const selectGroupSchedule = useSelectOne('Schedule', { data: getGroupSchedules.data });
  const getGroupUserSchedules = sh.useGetGroupUserSchedulesQuery({ groupName: group?.name || '', groupScheduleId: selectGroupSchedule.item?.id || '' }, { skip: !group || !selectGroupSchedule.item });
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