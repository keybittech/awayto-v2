import React from 'react';
import { useComponents } from 'awayto-hooks';
import { Route, Routes } from 'react-router';

export function GroupPaths (props: IProps): JSX.Element {
  
  const { ManageGroup, BookingHome } = useComponents();

  return <Routes>
    <Route path="manage/:component" element={<ManageGroup {...props} />} />
    <Route path="booking" element={<BookingHome {...props} />} />
  </Routes>
}

export default GroupPaths;
