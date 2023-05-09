import React, { useContext, useMemo } from 'react';

import { sh, useComponents, useContexts, useSelectOne } from 'awayto/hooks';

export function GroupScheduleProvider({ children }: IProps): JSX.Element {
  const { GroupScheduleSelectionProvider } = useComponents();
  
  const { GroupContext, GroupScheduleContext } = useContexts();

  const { group } = useContext(GroupContext) as GroupContextType;

  const { data: groupSchedules } = sh.useGetGroupSchedulesQuery({ groupName: group?.name || '' }, { skip: !group })

  const { item: groupSchedule, comp: GroupScheduleSelect, setId: setGroupScheduleId } = useSelectOne('Schedule', { data: groupSchedules });

  const { data: groupUserSchedules } = sh.useGetGroupUserSchedulesQuery({ groupName: group?.name || '', groupScheduleId: groupSchedule?.id || '' }, { skip: !group || !groupSchedule });

  const { item: groupScheduleService, comp: GroupScheduleServiceSelect, setId: setGroupScheduleServiceId } = useSelectOne('Service', { data: groupUserSchedules?.flatMap(gus => Object.values(gus.brackets).flatMap(b => Object.values(b.services))) });

  const { item :groupScheduleServiceTier, comp: GroupScheduleServiceTierSelect, setId: setGroupScheduleServiceTierId } = useSelectOne('Tier', { data: Object.values(groupScheduleService?.tiers || {}).sort((a, b) => new Date(a.createdOn).getTime() - new Date(b.createdOn).getTime()) });

  const groupScheduleContext = {
    groupSchedules,
    groupSchedule,
    setGroupScheduleId,
    groupUserSchedules,
    groupScheduleService,
    setGroupScheduleServiceId,
    groupScheduleServiceTier,
    setGroupScheduleServiceTierId,
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