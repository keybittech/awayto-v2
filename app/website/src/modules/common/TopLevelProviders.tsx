import React from 'react';
import { useComponents } from 'awayto/hooks';

export function TopLevelProviders({ children }: IProps): React.JSX.Element {
  const { GroupProvider, GroupScheduleProvider, WebSocketProvider } = useComponents();
  return <>
    <WebSocketProvider>
      <GroupProvider>
        <GroupScheduleProvider>
          {children}
        </GroupScheduleProvider>
      </GroupProvider>
    </WebSocketProvider>
  </>
}

export default TopLevelProviders;