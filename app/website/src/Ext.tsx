import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { useComponents } from './hooks'

export function Ext(): React.JSX.Element {

  const { GroupProvider, GroupScheduleProvider, Kiosk } = useComponents();

  return <>
    <Routes>
      <Route path="/kiosk/:groupName/:scheduleName?" element={
        <Kiosk />
      } />
    </Routes>
  </>
}

export default Ext;