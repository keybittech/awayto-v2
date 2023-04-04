import { useCallback } from 'react';
import { SiteRoles, hasRole } from 'awayto/core';
import { storeApi } from './store';

export function useSecure(): (targetRoles: SiteRoles[]) => boolean {
  const { data: profile } = storeApi.useGetUserProfileDetailsQuery();

  const hasRoleCb = useCallback((targetRoles: SiteRoles[]) => {
    if (profile) {
      return hasRole(profile.availableUserGroupRoles, targetRoles);
    }
    return false;
  }, [profile]);

  return hasRoleCb;
}