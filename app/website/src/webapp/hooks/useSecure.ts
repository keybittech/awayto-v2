import { useCallback } from 'react';
import { useRedux } from './useRedux';
import { SiteRoles, hasRole } from 'awayto';

export function useSecure(): (targetRoles: SiteRoles[]) => boolean {
  const { availableUserGroupRoles } = useRedux(state => state.profile);

  const hasRoleCb = useCallback((targetRoles: SiteRoles[]) => {
    return hasRole(availableUserGroupRoles, targetRoles);
  }, [availableUserGroupRoles]);

  return hasRoleCb;
}