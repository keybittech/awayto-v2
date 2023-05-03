import React from 'react';
import { useComponents } from 'awayto/hooks';

export function TopLevelProviders({ children }: IProps): JSX.Element {
  const { GroupProvider, GroupScheduleProvider } = useComponents();
  return <>
    <GroupProvider>
      <GroupScheduleProvider>
        {children}
      </GroupScheduleProvider>
    </GroupProvider>
  </>
}

export default TopLevelProviders;