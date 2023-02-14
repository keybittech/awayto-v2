import React, { useCallback } from 'react';
import { useParams } from 'react-router';
import { useRedux } from './useRedux';
import { SiteRoles, hasGroupRole } from 'awayto';

export function useGroupSecure(): (targetRoles: SiteRoles[]) => boolean {
  const { groupName } = useParams();
  const { groupRoles } = useRedux(state => state.profile);

  const hasGroupRoleCb = useCallback((targetRoles: SiteRoles[]) => {
    return !!groupName && hasGroupRole(groupName, groupRoles, targetRoles);
  }, [groupName, groupRoles]);

  return hasGroupRoleCb;
}