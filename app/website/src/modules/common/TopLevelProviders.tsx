import React from 'react';
import { useComponents } from 'awayto/hooks';

export function TopLevelProviders({ children }: IProps): React.JSX.Element {
  const { BookingProvider, GroupProvider, GroupScheduleProvider, WebSocketProvider } = useComponents();
  return <>
    <WebSocketProvider>
      <BookingProvider>
        <GroupProvider>
          <GroupScheduleProvider>
            {children}
          </GroupScheduleProvider>
        </GroupProvider>
      </BookingProvider>
    </WebSocketProvider>
  </>
}

export default TopLevelProviders;