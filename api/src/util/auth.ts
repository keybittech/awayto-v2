import { getAuthorization, IGroup, IRole } from 'awayto';
import { ApiRequestAuthorizer } from './db';

export default function authorize(params: ApiRequestAuthorizer): boolean {
  const { roles: requiredRoles, userToken: userRoles, inclusive } = params;
  
  const { hasRole, hasGroup } = getAuthorization(userRoles, requiredRoles);

  return inclusive ? hasRole : hasGroup;
}


export function parseGroupString (value: string): IGroup[] {
  const groups = [] as IGroup[];
  value?.split(';').forEach(set => {
    const [name, roles] = set.split(':');
    groups.push({ name, roles: roles.split(',').map(r => ({ name: r })) as IRole[] } as IGroup)
  });
  return groups;
}

export function parseGroupArray (groups: IGroup[]): string {
  let groupRoles = '';
  groups.forEach((g, i) => {
    groupRoles += `${g.name}:${g.roles.map(r => r.name).join(',')}`;
    if (groups[i + 1] != null) groupRoles += ';';
  });
  return groupRoles;
}
