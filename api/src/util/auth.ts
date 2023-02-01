import { getAuthorization } from 'awayto';
import { ApiRequestAuthorizer } from './db';

export default function authorize(params: ApiRequestAuthorizer): boolean {
  const { roles: requiredRoles, userToken: userRoles, inclusive } = params;
  
  const { hasRole, hasGroup } = getAuthorization(userRoles, requiredRoles);

  return inclusive ? hasRole : hasGroup;
}