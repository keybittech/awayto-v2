import React, { useCallback } from 'react';
import { useRedux } from './useRedux';
import { SiteRoles, hasRole } from 'awayto';

export function useSecure(): (targetRoles: SiteRoles[]) => boolean {
  const { groupRoles } = useRedux(state => state.profile);

  const hasRoleCb = useCallback((targetRoles: SiteRoles[]) => {
    return hasRole(groupRoles, targetRoles);
  }, [groupRoles]);

  return hasRoleCb;
}