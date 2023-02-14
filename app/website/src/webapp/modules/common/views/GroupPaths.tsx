import React, { ReactNode } from 'react';
import { useComponents } from 'awayto-hooks';
import { Route, Routes } from 'react-router';

export function GroupPaths (props: IProps): JSX.Element {
  
  const { ServiceHome, ScheduleHome, BookingHome } = useComponents();

  return <Routes>
    <Route path="service" element={<ServiceHome {...props} />} />
    <Route path="schedule" element={<ScheduleHome {...props} />} />
    <Route path="booking" element={<BookingHome {...props} />} />
  </Routes>
}

export default GroupPaths;
