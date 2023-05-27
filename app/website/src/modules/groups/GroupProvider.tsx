import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';

import { sh, useContexts, useSelectOne } from 'awayto/hooks';
import { isExternal } from 'awayto/core';

export function GroupProvider({ children }: IProps): React.JSX.Element {
  const { GroupContext } = useContexts();

  const { groupName } = useParams();

  const { data: profile } = sh.useGetUserProfileDetailsQuery(undefined, { skip: isExternal(window.location.pathname) });

  const groups = useMemo(() => profile ? Object.values(profile.groups || {}) : [], [profile]);

  const { item: group, comp: GroupSelect } = useSelectOne('Groups', { data: groups });
  const gn = groupName || group?.name || '';
  const skip = { skip: !gn };

  const { data: groupSchedules = [] } = sh.useGetGroupSchedulesQuery({ groupName: gn }, skip);
  const { data: groupServices = [] } = sh.useGetGroupServicesQuery({ groupName: gn }, skip);
  const { data: groupForms = [] } = sh.useGetGroupFormsQuery({ groupName: gn }, skip);
  const { data: groupRoles = [] } = sh.useGetGroupRolesQuery({ groupName: gn }, skip);

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