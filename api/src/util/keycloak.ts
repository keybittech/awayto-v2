

import KcAdminClient from '@keycloak/keycloak-admin-client';
import { BaseClient, Issuer } from 'openid-client';
import { Credentials } from '@keycloak/keycloak-admin-client/lib/utils/auth';
import { RoleMappingPayload } from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
import { performance } from 'perf_hooks';

import fetch from 'node-fetch';

import { IGroupRoleAuthActions, SiteRoles, asyncForEach, ApiErrorResponse } from 'awayto/core';
import redis, { clearLocalCache, redisProxy } from './redis';
import { Client } from 'pg';

let keycloakClient: BaseClient;
let ready: boolean = false;

const { APP_ROLE_CALL } = SiteRoles;

const {
  CUST_APP_HOSTNAME,
  KEYCLOAK_HOST,
  KEYCLOAK_PORT,
  KC_REALM,
  KC_CLIENT,
  KC_API_CLIENT_ID,
  KC_API_CLIENT_SECRET
} = process.env as { [prop: string]: string };

// KC Admin
const keycloak = new KcAdminClient({
  baseUrl: `https://${KEYCLOAK_HOST}:${KEYCLOAK_PORT}`,
  realmName: KC_REALM
});

const credentials: Credentials = {
  clientId: KC_API_CLIENT_ID,
  clientSecret: KC_API_CLIENT_SECRET,
  grantType: 'client_credentials'
}

const regroup = async function (groupId?: string) {
  try {
    let groups: GroupRepresentation[] = [];

    const { groupRoleActions } = await redisProxy('groupRoleActions');
    const oldGroupRoleActions = (await groupRoleActions || {}) as Record<string, IGroupRoleAuthActions>;

    if (groupId) {
      performance.mark("regroupOneGroupStart");
      const group = await keycloak.groups.findOne({ id: groupId });
      groups = group ? [group] : [];
    } else {
      performance.mark("regroupAllGroupsStart");
      groups = groups.length ? groups : await keycloak.groups.find();
    }

    const newGroupRoleActions: Record<string, IGroupRoleAuthActions> = {};

    await asyncForEach(groups, async group => {
      if (!group.subGroups) return;
      await asyncForEach(group.subGroups, async ({ path, id: subgroupId }) => {
        if (!path || !subgroupId) return;
        if (!oldGroupRoleActions[path] || oldGroupRoleActions[path].fetch as boolean || groupId) {

          const roleMappings = await keycloak.groups.listRoleMappings({ id: subgroupId }) as {
            clientMappings: {
              [prop: string]: {
                mappings: {
                  id: string;
                  name: string
                }[]
              }
            }
          };

          if (roleMappings.clientMappings) {
            newGroupRoleActions[path] = roleMappings.clientMappings[KC_CLIENT].mappings.reduce((m: Record<string, string | boolean | Record<string, string>[]>, { id: actionId, name }) => ({ ...m, id: subgroupId, fetch: false, actions: [...(m.actions || []) as Record<string, string>[], { id: actionId, name }] }), {}) as IGroupRoleAuthActions;
          }

        } else {
          console.log(' using cache for ', path);
          newGroupRoleActions[path as string] = oldGroupRoleActions[path as string];
        }
      });
    });

    await redis.set('groupRoleActions', JSON.stringify(newGroupRoleActions));
    clearLocalCache('groupRoleActions');

    if (groupId) {
      performance.mark("regroupOneGroupEnd");
      performance.measure("regroupOneGroupStart to regroupOneGroupEnd", "regroupOneGroupStart", "regroupOneGroupEnd");
    } else {
      performance.mark("regroupAllGroupsEnd");
      performance.measure("regroupAllGroupsStart to regroupAllGroupsEnd", "regroupAllGroupsStart", "regroupAllGroupsEnd");
    }
  } catch (error) {
    console.log('regroup failed', error);
  }

}

async function go() {

  try {

    while (false === redis.isReady) {
      console.error('redis is not ready');
      await new Promise<void>(res => setTimeout(() => res(), 1000));
    }

    // API Client admin keycloak login
    await keycloak.auth(credentials);
    console.log('keycloak connected');
    await regroup();

    // Refresh api credentials/groups every 58 seconds
    setInterval(async () => {
      try {
        await keycloak.auth(credentials);
        await regroup();
        ready = true;
      } catch (error) {
        console.log('Could not auth with keycloak and regroup. Will try again in 1 minute.');
        ready = false;
      }
    }, 58 * 1000); // 58 seconds

    // Get a reference to the realm we're connected to
    const realmRequest = (await keycloak.realms.find()).find(r => r.realm === process.env.KC_REALM);

    if (realmRequest) {
      await redis.set('realm', JSON.stringify(realmRequest));

      // Get a reference to the react application's client, as users are based there
      const appClientRequest = (await keycloak.clients.find({ realm: process.env.KC_REALM })).find(c => c.clientId === process.env.KC_CLIENT);

      if (appClientRequest) {
        await redis.set('appClient', JSON.stringify(appClientRequest));
        // Get the client roles, which are application universal roles, not specific to any group
        const appRoles = await keycloak.clients.listRoles({ id: appClientRequest.id! });

        if (appRoles.length) {
          await redis.set('appRoles', JSON.stringify(appRoles));
          await redis.set('groupAdminRoles', JSON.stringify(appRoles.filter(r => ![APP_ROLE_CALL].includes(r.name as SiteRoles)).map(({ id, name }) => ({ id, name })) as RoleMappingPayload[]));
          await redis.set('roleCall', JSON.stringify(appRoles.filter(r => r.name === APP_ROLE_CALL).map(({ id, name }) => ({ id, name })) as RoleMappingPayload[]));
        }
      }
    }

  } catch (error) {
    const err = error as ApiErrorResponse;
    await new Promise<void>(res => setTimeout(() => res(), 1000));
    console.log('Could not connect to keycloak ', err.message);
    await go();
  }

  // KC Passport & OIDC Client
  const keycloakIssuer = await Issuer.discover(`https://${KEYCLOAK_HOST}:${KEYCLOAK_PORT}/realms/${KC_REALM}`);
  keycloakClient = new keycloakIssuer.Client({
    client_id: KC_API_CLIENT_ID,
    client_secret: KC_API_CLIENT_SECRET,
    redirect_uris: [`https://${CUST_APP_HOSTNAME}/api/auth/login/callback`],
    post_logout_redirect_uris: [`https://${CUST_APP_HOSTNAME}/api/auth/logout/callback`],
    response_types: ['code']
  });


  ready = true;
}

export async function getGroupRegistrationRedirectParts(groupCode: string): Promise<[string, string[]]> {
  try {
    // Make a request to the Keycloak login page to retrieve the tab_id parameter
    const loginUrl = `https://${CUST_APP_HOSTNAME}/auth/realms/${KC_REALM}/protocol/openid-connect/auth?client_id=${KC_CLIENT}&redirect_uri=https://${CUST_APP_HOSTNAME}/api/auth/login/callback&response_type=code&scope=openid`;
    const loginPageResponse = await fetch(loginUrl, { redirect: 'manual' });

    // Extract tab_id from response body using regex
    const html = await loginPageResponse.text();
    const match = html.match(/tab_id=([\w-]+)"/);
    const tabId = match ? match[1] : null;

    const registrationUrl = `https://${CUST_APP_HOSTNAME}/auth/realms/${KC_REALM}/login-actions/registration?client_id=${KC_CLIENT}&tab_id=${tabId}&group_code=${groupCode}`;
    const loginCookies = loginPageResponse.headers.raw()['set-cookie'].map(c => c.split(';')[0]);

    return [registrationUrl, loginCookies];
  } catch (error) {
    throw { reason: 'Unexpected error, try again later.' };
  }
}


void go();

export {
  ready,
  keycloak,
  keycloakClient,
  regroup
}