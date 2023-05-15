import React from 'react';

import { useComponents } from 'awayto/hooks';

export function ScheduleHome(props: IProps): React.JSX.Element {
  const { ManageScheduleBrackets } = useComponents();
  return <ManageScheduleBrackets {...props} />
}

export default ScheduleHome;