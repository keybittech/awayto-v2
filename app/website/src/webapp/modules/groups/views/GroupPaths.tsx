import React from 'react';
import { useComponents } from 'awayto-hooks';
import { Route, Routes } from 'react-router';

export function GroupPaths (props: IProps): JSX.Element {
  
  const { ManageGroup } = useComponents();

  return <Routes>
    <Route path="manage/:component" element={<ManageGroup {...props} />} />
  </Routes>
}

export default GroupPaths;
