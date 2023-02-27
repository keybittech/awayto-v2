import { SiteRoles, UserGroupRoles } from './types';


// Keycloak strategy user type
export type StrategyUser = {
  test?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  sub: string;
  groups?: string[];
}

/**
 * @category Authorization
 */
export const hasRole = function (availableUserGroupRoles?: UserGroupRoles, targetRoles?: SiteRoles[]): boolean {
  if (!targetRoles) return false;
  if (!availableUserGroupRoles) return false;
  return Object.values(Object.values(availableUserGroupRoles).flatMap(gr => Object.values(gr as Record<string, string[]>))).some(gr => gr.some(r => targetRoles.includes(SiteRoles[r as SiteRoles])));
}

/**
 * @category Authorization
 */
export const hasGroupRole = function (groupName: string, availableUserGroupRoles?: UserGroupRoles, targetRoles?: SiteRoles[]): boolean {
  if (!targetRoles) return false;
  if (!availableUserGroupRoles) return false;
  if (!availableUserGroupRoles[groupName]) return false;
  return Object.values(availableUserGroupRoles[groupName]).some((gr) => (gr as string[]).some(r => targetRoles.includes(SiteRoles[r as SiteRoles])));
}