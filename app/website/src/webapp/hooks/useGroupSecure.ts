import React, { useCallback } from 'react';
import { useParams } from 'react-router';
import { useRedux } from './useRedux';
import { SiteRoles, hasRole } from 'awayto';

export function useGroupSecure(): (targetRoles: SiteRoles[]) => boolean {
  const { groupName } = useParams();
  const { groupRoles } = useRedux(state => state.profile);

  const hasGroupRole = useCallback((targetRoles: SiteRoles[]) => {
    return !!groupName && hasRole(groupName, groupRoles, targetRoles);
  }, [groupName, groupRoles]);

  return hasGroupRole;
}