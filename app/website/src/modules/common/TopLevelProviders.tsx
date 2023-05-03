import React from 'react';
import { useComponents } from 'awayto/hooks';

export function TopLevelProviders({ children }: IProps): JSX.Element {
  const { GroupProvider } = useComponents();
  return <>
    <GroupProvider>
      {children}
    </GroupProvider>
  </>
}

export default TopLevelProviders;