import { IGroup } from 'awayto/core';
import { IBaseComponent } from 'awayto/hooks';
import { createContext } from 'react';

declare global {
  type GroupContextType = {
    groups: IGroup[];
    group: IGroup;
    GroupSelect: React.LazyExoticComponent<IBaseComponent> | (() => JSX.Element);
  }
}

export const GroupContext = createContext<GroupContextType | null>(null);

export default GroupContext;