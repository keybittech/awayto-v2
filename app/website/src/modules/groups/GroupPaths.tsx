import React from 'react';
import { useComponents } from 'awayto/hooks';
import { Route, Routes } from 'react-router';

export function GroupPaths (props: IProps): React.JSX.Element {
  
  const { ManageGroupHome } = useComponents();

  return <Routes>
    <Route path="manage/:component" element={<ManageGroupHome {...props} />} />
  </Routes>
}

export default GroupPaths;
