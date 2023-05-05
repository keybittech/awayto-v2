import React, { useContext } from 'react';

import Card from '@mui/material/Card';

import { useContexts } from 'awayto/hooks';


function OnboardGroup(props: IProps) {

  const { groups = [] } = useContext(useContexts().GroupContext) as GroupContextType;

  return groups.map(group => {
    return <Card>
      {group.name}
    </Card>
  });
}

export default OnboardGroup;