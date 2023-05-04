import { IGroup } from 'awayto/core';
import { IDefaultedComponent } from 'awayto/hooks';
import { createContext } from 'react';

declare global {
  type GroupContextType = {
    groups: IGroup[];
    group: IGroup;
    GroupSelect: IDefaultedComponent;
  }
}

export const GroupContext = createContext<GroupContextType | null>(null);

export default GroupContext;