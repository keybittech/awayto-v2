import { useCallback, useMemo } from 'react';
import { SiteRoles, hasGroupRole } from 'awayto/core';
import { sh } from './store';

export function useGroupSecure(): (targetRoles: SiteRoles[]) => boolean {
  const { data : profile } = sh.useGetUserProfileDetailsQuery();
  const group = useMemo(() => Object.values(profile?.groups || {}).find(g => g.active), [profile]);
  return useCallback((targetRoles: SiteRoles[]) => {
    return !!profile && !!group && hasGroupRole(group.name, profile.availableUserGroupRoles, targetRoles);
  }, [profile, group]);
}