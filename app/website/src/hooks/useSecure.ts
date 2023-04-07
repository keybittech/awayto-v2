import { useCallback } from 'react';
import { SiteRoles, hasRole } from 'awayto/core';
import { sh } from './store';

export function useSecure(): (targetRoles: SiteRoles[]) => boolean {
  const { data: profile } = sh.useGetUserProfileDetailsQuery();
  if (!profile) return () => false;

  const hasRoleCb = useCallback((targetRoles: SiteRoles[]) => {
    if (profile) {
      return hasRole(profile.availableUserGroupRoles, targetRoles);
    }
    return false;
  }, [profile]);

  return hasRoleCb;
}