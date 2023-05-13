import React from 'react';

import Box from '@mui/material/Box';

import ManageGroups from './ManageGroups';
import { useComponents } from 'awayto/hooks';

export function GroupHome (props: IProps): React.JSX.Element {
  const { OnboardGroup } = useComponents();
  return <>
    <Box mb={4}>
      <OnboardGroup {...props} />
    </Box>
    <Box mb={4}>
      <ManageGroups {...props} />
    </Box>
  </>
}

export default GroupHome;