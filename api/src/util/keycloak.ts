

import KcAdminClient from '@keycloak/keycloak-admin-client';
import { BaseClient, Issuer } from 'openid-client';
import { Credentials } from '@keycloak/keycloak-admin-client/lib/utils/auth';
import RealmRepresentation from '@keycloak/keycloak-admin-client/lib/defs/realmRepresentation';
import ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import RoleRepresentation, { RoleMappingPayload } from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
import { performance } from 'perf_hooks';

import { IGroupRoleActions, GroupRoleActions, SiteRoles, asyncForEach } from 'awayto';

let realm: RealmRepresentation = {};
let appClient: ClientRepresentation = {};
let appRoles: RoleRepresentation[] = [];
let groupAdminRoles: RoleMappingPayload[] = [];
let roleCall: RoleMappingPayload[] = [];
let groupRoleActions: IGroupRoleActions = {};
let keycloakClient: BaseClient;

const {
  CUST_APP_HOSTNAME,
  KC_REALM,
  KC_CLIENT,
  KC_API_CLIENT_ID,
  KC_API_CLIENT_SECRET
} = process.env as { [prop: string]: string };

// KC Admin
const keycloak = new KcAdminClient({
  baseUrl: `https://${CUST_APP_HOSTNAME}/auth`,
  realmName: KC_REALM
});

const credentials: Credentials = {
  clientId: KC_API_CLIENT_ID,
  clientSecret: KC_API_CLIENT_SECRET,
  grantType: 'client_credentials'
}

const regroup = async function (groupId?: string) {

  let groups: GroupRepresentation[] = [];

  if (groupId) {
    performance.mark("regroupOneGroupStart");
    const group = await keycloak.groups.findOne({ id: groupId });
    groups = group ? [group] : [];
  } else {
    performance.mark("regroupAllGroupsStart");
    groups = groups.length ? groups : await keycloak.groups.find();
  }

  const newGroupRoleActions: IGroupRoleActions = {};

  await asyncForEach(groups, async group => {
    if (!group.subGroups) return;
    await asyncForEach(group.subGroups, async ({ path, id: subgroupId }) => {
      if (!path || !subgroupId) return;
      if (!groupRoleActions[path] || groupRoleActions[path].fetch as boolean) {

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
          newGroupRoleActions[path] = roleMappings.clientMappings[KC_CLIENT].mappings.reduce((m: Record<string, string | boolean | Record<string, string>[]>, { id: actionId, name }) => ({ ...m, id: subgroupId, fetch: false, actions: [...(m.actions || []) as Record<string, string>[], { id: actionId, name }] }), {}) as GroupRoleActions;
        }

      } else {
        console.log(' using cache for ', path);
        newGroupRoleActions[path as string] = groupRoleActions[path as string];
      }
    });
  });

  groupRoleActions = newGroupRoleActions;

  if (groupId) {
    performance.mark("regroupOneGroupEnd");
    performance.measure("regroupOneGroupStart to regroupOneGroupEnd", "regroupOneGroupStart", "regroupOneGroupEnd");
  } else {
    performance.mark("regroupAllGroupsEnd");
    performance.measure("regroupAllGroupsStart to regroupAllGroupsEnd", "regroupAllGroupsStart", "regroupAllGroupsEnd");
  }

}

async function go() {

  try {
    // API Client admin keycloak login
    await keycloak.auth(credentials);
    await regroup();

    // Refresh api credentials/groups every 58 seconds
    setInterval(async () => {
      await keycloak.auth(credentials);
      await regroup();
    }, 58 * 1000); // 58 seconds

    // Get a reference to the realm we're connected to
    const realmRequest = (await keycloak.realms.find()).find(r => r.realm === process.env.KC_REALM);

    if (realmRequest) {
      realm = realmRequest;

      // Get a reference to the react application's client, as users are based there
      const appClientRequest = (await keycloak.clients.find({ realm: process.env.KC_REALM })).find(c => c.clientId === process.env.KC_CLIENT);

      if (appClientRequest) {
        appClient = appClientRequest;
        // Get the client roles, which are application universal roles, not specific to any group
        const appClientRolesRequest = await keycloak.clients.listRoles({ id: appClient.id! });

        if (appClientRolesRequest.length) {
          appRoles = appClientRolesRequest;
          groupAdminRoles = appRoles.filter(r => r.name !== SiteRoles.APP_ROLE_CALL).map(({ id, name }) => ({ id, name })) as RoleMappingPayload[]
          roleCall = appRoles.filter(r => r.name === SiteRoles.APP_ROLE_CALL).map(({ id, name }) => ({ id, name })) as RoleMappingPayload[]
        }
      }
    }
  } catch (error) {
    console.log('init error', error)
  }

  // KC Passport & OIDC Client
  const keycloakIssuer = await Issuer.discover(`https://${CUST_APP_HOSTNAME}/auth/realms/${KC_REALM}`);
  keycloakClient = new keycloakIssuer.Client({
    client_id: KC_API_CLIENT_ID,
    client_secret: KC_API_CLIENT_SECRET,
    redirect_uris: [`https://${CUST_APP_HOSTNAME}/api/auth/login/callback`],
    post_logout_redirect_uris: [`https://${CUST_APP_HOSTNAME}/api/auth/logout/callback`],
    response_types: ['code']
  });



}


void go();

export {
  keycloak,
  keycloakClient,
  realm,
  appClient,
  appRoles,
  groupAdminRoles,
  roleCall,
  groupRoleActions,
  regroup
}