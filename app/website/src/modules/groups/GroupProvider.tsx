import React, { useMemo } from 'react';

import { sh, useContexts, useSelectOne } from 'awayto/hooks';
import { isExternal } from 'awayto/core';

export function GroupProvider({ children }: IProps): React.JSX.Element {
  const { GroupContext } = useContexts();

  const { data: profile } = sh.useGetUserProfileDetailsQuery(undefined, { skip: isExternal(window.location.pathname) });

  const groups = useMemo(() => Object.values(profile?.groups || {}), [profile]);

  const { item: group, comp: GroupSelect } = useSelectOne('Groups', { data: groups });

  const { data: groupSchedules = [] } = sh.useGetGroupSchedulesQuery();
  const { data: groupServices = [] } = sh.useGetGroupServicesQuery();
  const { data: groupForms = [] } = sh.useGetGroupFormsQuery();
  const { data: groupRoles = [] } = sh.useGetGroupRolesQuery();

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