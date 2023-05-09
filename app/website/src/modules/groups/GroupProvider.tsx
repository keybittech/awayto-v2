import React, { useMemo } from 'react';

import { sh, useContexts, useSelectOne } from 'awayto/hooks';

export function GroupProvider({ children }: IProps): JSX.Element {
  const { GroupContext } = useContexts();

  const { data: profile } = sh.useGetUserProfileDetailsQuery();

  const groups = useMemo(() => profile ? Object.values(profile.groups || {}) : [], [profile]);

  const { item: group, comp: GroupSelect } = useSelectOne('Groups', { data: groups });
  const groupName = group?.name || '';
  const skip = { skip: !groupName };

  const { data: groupSchedules = [] } = sh.useGetGroupSchedulesQuery({ groupName }, skip);
  const { data: groupServices = [] } = sh.useGetGroupServicesQuery({ groupName }, skip);
  const { data: groupForms = [] } = sh.useGetGroupFormsQuery({ groupName }, skip);
  const { data: groupRoles = [] } = sh.useGetGroupRolesQuery({ groupName }, skip);

  const groupContext = {
    groups,
    group,
    groupSchedules,
    groupServices,
    groupForms,
    groupRoles,
    GroupSelect
  } as GroupContextType | null;

  return useMemo(() => !GroupContext ? <></> :
    <GroupContext.Provider value={groupContext}>
      {children}
    </GroupContext.Provider>,
    [GroupContext, groupContext]
  );
}

export default GroupProvider;