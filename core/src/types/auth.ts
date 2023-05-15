import { UserGroupRoles } from './profile';

/**
 * @category Authorization
 */
export type KcSiteOpts = {
  regroup: (groupId?: string) => Promise<void>;
}

/**
 * @category Authorization
 */
export type DecodedJWTToken = {
  resource_access: {
    [prop: string]: { roles: string[] }
  },
  groups: string[]
}

/**
 * @category Authorization
 */
export enum SiteRoles {
  APP_ROLE_CALL = 'APP_ROLE_CALL',
  APP_GROUP_ADMIN = 'APP_GROUP_ADMIN',
  APP_GROUP_ROLES = 'APP_GROUP_ROLES',
  APP_GROUP_USERS = 'APP_GROUP_USERS',
  // APP_GROUP_MATRIX = 'APP_GROUP_MATRIX',
  APP_GROUP_SERVICES = 'APP_GROUP_SERVICES',
  APP_GROUP_BOOKINGS = 'APP_GROUP_BOOKINGS',
  APP_GROUP_FEATURES = 'APP_GROUP_FEATURES',
  APP_GROUP_SCHEDULES = 'APP_GROUP_SCHEDULES'
}

/**
 * @category Authorization
 */
export type StrategyUser = {
  username?: string;
  sub: string;
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

/**
 * @category Authorization
 */
export const getTokenHeaders = function(): { headers: Record<string, string> } {
  const token = localStorage.getItem('kc_token');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token as string}`
    }
  }
}