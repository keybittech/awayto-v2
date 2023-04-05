import { useCallback } from 'react';
import { useParams } from 'react-router';
import { SiteRoles, hasGroupRole } from 'awayto/core';
import { storeApi } from './store';

export function useGroupSecure(): (targetRoles: SiteRoles[]) => boolean {
  const { groupName } = useParams();
  const { data : profile } = storeApi.useGetUserProfileDetailsQuery();
  return useCallback((targetRoles: SiteRoles[]) => {
    return !!profile && !!groupName && hasGroupRole(groupName, profile.availableUserGroupRoles, targetRoles);
  }, [groupName, profile]);
}