import { IGroup } from './group';
import { UserGroupRoles } from './profile';

declare module 'express-session' {
  interface SessionData {
    nonce?: string;
    group?: IGroup;
    groups?: string[];
    availableUserGroupRoles?: UserGroupRoles;
  }
}

export {}