

import KcAdminClient from '@keycloak/keycloak-admin-client';
import { IdTokenClaims, Issuer, Strategy, StrategyVerifyCallbackUserInfo } from 'openid-client';
import { Credentials } from '@keycloak/keycloak-admin-client/lib/utils/auth';
import RealmRepresentation from '@keycloak/keycloak-admin-client/lib/defs/realmRepresentation';
import ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
import { asyncForEach } from './db';
import MappingsRepresentation from '@keycloak/keycloak-admin-client/lib/defs/mappingsRepresentation';

let realm: RealmRepresentation = {};
let appClient: ClientRepresentation = {};
let appRoles: RoleRepresentation[] = [];
let appGroups: Record<string, GroupRepresentation> = {};



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

try {
  // API Client admin keycloak login
  await keycloak.auth(credentials);

  // Refresh api credentials every 58 seconds
  setInterval(async () => {
    await keycloak.auth(credentials);

    const groups = await keycloak.groups.find();
  

    await asyncForEach(groups, async group => {

      const [subgroup] = group.subGroups as GroupRepresentation[];
      const roleMappings = await keycloak.groups.listRoleMappings({ id: subgroup.id as string }) as {
        clientMappings: {
          [prop: string]: {
            mappings: MappingsRepresentation[]
          }
        }
      };

      subgroup.clientRoles = roleMappings.clientMappings[KC_CLIENT].mappings;

    });

  } , 5 * 1000); // 58 seconds
  
  // Get a reference to the realm we're connected to
  const realmRequest = (await keycloak.realms.find()).find(r => r.realm === process.env.KC_REALM);

  if (realmRequest) {
    realm = realmRequest;

    // Get a reference to the react application's client, as users are based there
    const appClientRequest = (await keycloak.clients.find({ realm: process.env.KC_REALM })).find(c => c.clientId === process.env.KC_CLIENT);

    if (appClientRequest) {
      appClient = appClientRequest;

      // Get the client roles, which are application universal roles, not specific to any group
      const appClientRolesRequest = await keycloak.clients.listRoles({ id : appClient.id! });

      if (appClientRolesRequest.length) {
        appRoles = appClientRolesRequest;
      }
    }
  }
} catch (error) {
  console.log('init error', error)
}

export type DecodedJWTToken = IdTokenClaims & {
  resource_access: {
    [prop: string]: { roles: string[] }
  },
  groups: string[]
}

export type StrategyUser = Express.User & {
  test?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  sub?: string;
  groups?: string[];
}

// KC Passport & OIDC Client
const keycloakIssuer = await Issuer.discover(`https://${CUST_APP_HOSTNAME}/auth/realms/${KC_REALM}`);
const keycloakClient = new keycloakIssuer.Client({
  client_id: KC_API_CLIENT_ID,
  client_secret: KC_API_CLIENT_SECRET,
  redirect_uris: [`https://${CUST_APP_HOSTNAME}/api/auth/login/callback`],
  post_logout_redirect_uris: [`https://${CUST_APP_HOSTNAME}/api/auth/logout/callback`],
  response_types: ['code']
});

const strategyResponder: StrategyVerifyCallbackUserInfo<StrategyUser> = (tokenSet, userInfo, done) => {

  const { preferred_username: username, given_name: firstName, family_name: lastName, email, sub } = tokenSet.claims();

  const userProfileClaims: StrategyUser = {
    username,
    firstName,
    lastName,
    email,
    sub
  };

  return done(null, userProfileClaims);
}

const keycloakStrategy = new Strategy<StrategyUser>({ client: keycloakClient }, strategyResponder);

export { 
  keycloak,
  keycloakStrategy,
  realm,
  appClient,
  appRoles
}