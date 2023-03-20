import { createClient } from "redis";
import { IGroupRoleAuthActions } from 'awayto';
import RoleRepresentation, { RoleMappingPayload } from "@keycloak/keycloak-admin-client/lib/defs/roleRepresentation";
import ClientRepresentation from "@keycloak/keycloak-admin-client/lib/defs/clientRepresentation";

export const redis = createClient();

export type RedisClient = typeof redis;

redis.on('error', console.error)

type ProxyKeys = Record<string, unknown> & {
  adminSub: string;
  appClient: ClientRepresentation;
  groupRoleActions: Record<string, IGroupRoleAuthActions>;
  groupAdminRoles: RoleMappingPayload[];
  appRoles: RoleRepresentation[];
  roleCall: RoleMappingPayload[];
}

const cache = new Map<string, { value: unknown, timestamp: number }>();

export const clearLocalCache = function(prop: string): void {
  const cached = cache.get(prop);
  cached && cache.set(prop, { ...cached, timestamp: cached.timestamp - 30000 });
}

export const redisProxy = async function(...args: string[]): Promise<ProxyKeys> {
  const now = Date.now();
  const props = await Promise.all(args.map(async prop => {
    const cachedProp = cache.get(prop);
    if (cachedProp && now - cachedProp.timestamp < 30000 && cachedProp.value) {
      return { [prop]: cachedProp.value }
    } else {
      const value = await redis.get(prop);
      try {
        const res = { [prop]: JSON.parse(value as string) }
        cache.set(prop, { value: res[prop], timestamp: now })
        return res;
      } catch (error) {
        cache.set(prop, { value, timestamp: now })
        return { [prop]: value };
      }
    }
  }));
  return Object.assign({}, ...props);
}

async function go() {
  try {
    await redis.connect();
  } catch (error) {
    console.log('caught redis connect error', error);
  }
}

void go();

export default redis;