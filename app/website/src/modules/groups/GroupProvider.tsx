import React, { useMemo } from 'react';

import { sh, useContexts, useSelectOne } from 'awayto/hooks';

export function GroupProvider({ children }: IProps): JSX.Element {
  const { GroupContext } = useContexts();

  const { data: profile } = sh.useGetUserProfileDetailsQuery();

  const groups = useMemo(() => profile ? Object.values(profile.groups || {}) : [], [profile]);

  const [group, GroupSelect] = useSelectOne('Groups', { data: groups });

  const groupContext = {
    groups,
    group,
    GroupSelect
  } as GroupContextType | null;

  return useMemo(() =>GroupContext ? <GroupContext.Provider value={groupContext}>
    {children}
  </GroupContext.Provider> : <></>, [GroupContext, groupContext]);
}

export default GroupProvider;