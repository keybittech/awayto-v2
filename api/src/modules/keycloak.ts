
import { RoleMappingPayload } from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
import KeycloakAdminClient from '@keycloak/keycloak-admin-client';
import { performance } from 'perf_hooks';
import { Redis } from 'ioredis';

import { IGroupRoleAuthActions, SiteRoles, ApiErrorResponse, RegroupBuilder } from 'awayto/core';

const { APP_ROLE_CALL } = SiteRoles;

const {
  KC_CLIENT
} = process.env as { [prop: string]: string };

let regrouping = false;

export const regroup: RegroupBuilder = (keycloakClient, redisClient, redisProxy, clearLocalCache) => async (groupId?: string): Promise<void> => {

  if (!groupId && regrouping) return;
  regrouping = true;

  try {
    let groups: GroupRepresentation[] = [];

    const { groupRoleActions } = await redisProxy('groupRoleActions');
    const oldGroupRoleActions = (await groupRoleActions || {}) as Record<string, IGroupRoleAuthActions>;

    if (groupId) {
      const group = await keycloakClient.groups.findOne({ id: groupId });
      groups = group ? [group] : [];
    } else {
      performance.mark("regroupStart");
      groups = await keycloakClient.groups.find();
    }

    const newGroupRoleActions: Record<string, IGroupRoleAuthActions> = {};

    let roleCount = 0;

    for (const group of groups) {
      if (group.subGroups) {
        roleCount += group.subGroups.length;
        for (const { path, id: subgroupId } of group.subGroups) {
          if (path && subgroupId) {
            if (!oldGroupRoleActions[path] || oldGroupRoleActions[path].fetch as boolean || groupId) {
              const roleMappings = await keycloakClient.groups.listRoleMappings({ id: subgroupId }) as {
                clientMappings: {
                  [prop: string]: {
                    mappings: {
                      id: string;
                      name: string
                    }[]
                  }
                }
              };
    
              newGroupRoleActions[path] = !roleMappings.clientMappings ? {
                id: subgroupId,
                fetch: false,
                actions: []
              } : roleMappings.clientMappings[KC_CLIENT].mappings.reduce((m, { id: actionId, name }) => ({
                  ...m,
                  id: subgroupId,
                  fetch: false,
                  actions: [...(m.actions || []), { id: actionId, name }]
                }), {} as IGroupRoleAuthActions);    
            } else {
              // console.log(' using cache for ', path);
              newGroupRoleActions[path] = oldGroupRoleActions[path];
            }
          }
        }
      }
    }

    if (Object.keys(newGroupRoleActions).length) {
      await redisClient.set('groupRoleActions', JSON.stringify(newGroupRoleActions));
      clearLocalCache('groupRoleActions');
    }

    if (!groupId) {
      performance.mark("regroupEnd");
      performance.measure(`regroup ${groups.length} ${roleCount}`, "regroupStart", "regroupEnd");
    }
  } catch (error) {
    console.log('regroup failed', error);
  }

  regrouping = false;
}

export async function initKeycloak(keycloakClient: KeycloakAdminClient, redisClient: Redis) {

  try {

    // Get a reference to the realm we're connected to
    const realmRequest = (await keycloakClient.realms.find()).find(r => r.realm === process.env.KC_REALM);

    if (realmRequest) {
      await redisClient.set('realm', JSON.stringify(realmRequest));

      // Get a reference to the react application's client, as users are based there
      const appClientRequest = (await keycloakClient.clients.find({ realm: process.env.KC_REALM })).find(c => c.clientId === process.env.KC_CLIENT);

      if (appClientRequest) {
        await redisClient.set('appClient', JSON.stringify(appClientRequest));
        // Get the client roles, which are application universal roles, not specific to any group
        const appRoles = await keycloakClient.clients.listRoles({ id: appClientRequest.id! });

        if (appRoles.length) {
          await redisClient.set('appRoles', JSON.stringify(appRoles));
          await redisClient.set('groupAdminRoles', JSON.stringify(appRoles.filter(r => ![APP_ROLE_CALL].includes(r.name as SiteRoles)).map(({ id, name }) => ({ id, name })) as RoleMappingPayload[]));
          await redisClient.set('roleCall', JSON.stringify(appRoles.filter(r => r.name === APP_ROLE_CALL).map(({ id, name }) => ({ id, name })) as RoleMappingPayload[]));
        }
      }
    }

    console.log('Set keycloak global data')
  } catch (error) {
    const err = error as ApiErrorResponse;
    await new Promise<void>(res => setTimeout(() => res(), 1000));
    console.log('Could not connect to keycloak ', err.message, err.stack);
    await initKeycloak(keycloakClient, redisClient);
  }
}
