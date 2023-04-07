import { useCallback } from 'react';
import { useParams } from 'react-router';
import { SiteRoles, hasGroupRole } from 'awayto/core';
import { sh } from './store';

export function useGroupSecure(): (targetRoles: SiteRoles[]) => boolean {
  const { groupName } = useParams();
  const { data : profile } = sh.useGetUserProfileDetailsQuery();
  if (!profile) return () => false;
  return useCallback((targetRoles: SiteRoles[]) => {
    return !!profile && !!groupName && hasGroupRole(groupName, profile.availableUserGroupRoles, targetRoles);
  }, [groupName, profile]);
}