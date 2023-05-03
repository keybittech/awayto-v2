import React, { useContext, useMemo } from 'react';

import { sh, useComponents, useContexts, useSelectOne } from 'awayto/hooks';

export function GroupScheduleProvider({ children }: IProps): JSX.Element {
  const { GroupScheduleSelectionProvider } = useComponents();
  
  const { GroupContext, GroupScheduleContext } = useContexts();

  const { group } = useContext(GroupContext) as GroupContextType;

  const { data: groupSchedules } = sh.useGetGroupSchedulesQuery({ groupName: group?.name || '' }, { skip: !group })

  const [groupSchedule, GroupScheduleSelect] = useSelectOne('Schedule', { data: groupSchedules });

  const { data: groupUserSchedules } = sh.useGetGroupUserSchedulesQuery({ groupName: group?.name || '', groupScheduleId: groupSchedule?.id || '' }, { skip: !group || !groupSchedule });

  const [groupScheduleService, GroupScheduleServiceSelect] = useSelectOne('Service', { data: groupUserSchedules?.flatMap(gus => Object.values(gus.brackets).flatMap(b => Object.values(b.services))) });

  const [groupScheduleServiceTier, GroupScheduleServiceTierSelect] = useSelectOne('Tier', { data: Object.values(groupScheduleService?.tiers || {}).sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime()) });

  const groupScheduleContext = {
    groupSchedules,
    groupSchedule,
    groupUserSchedules,
    groupScheduleService,
    groupScheduleServiceTier,
    GroupScheduleSelect,
    GroupScheduleServiceSelect,
    GroupScheduleServiceTierSelect
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