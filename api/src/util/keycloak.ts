

import KcAdminClient from '@keycloak/keycloak-admin-client';
import { Issuer, Strategy, StrategyVerifyCallbackUserInfo } from 'openid-client';
import { Credentials } from '@keycloak/keycloak-admin-client/lib/utils/auth';
import RealmRepresentation from '@keycloak/keycloak-admin-client/lib/defs/realmRepresentation';
import ClientRepresentation from '@keycloak/keycloak-admin-client/lib/defs/clientRepresentation';
import RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';
import jwtDecode from 'jwt-decode';

let realm: RealmRepresentation = {};
let appClient: ClientRepresentation = {};
let appRoles: RoleRepresentation[] = [];

const {
  CUST_APP_HOSTNAME,
  KC_REALM,
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
  setInterval(() => keycloak.auth(credentials), 58 * 1000); // 58 seconds
  
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



// KC Passport & OIDC Client
const keycloakIssuer = await Issuer.discover(`https://${CUST_APP_HOSTNAME}/auth/realms/${KC_REALM}`);
const keycloakClient = new keycloakIssuer.Client({
  client_id: KC_API_CLIENT_ID,
  client_secret: KC_API_CLIENT_SECRET,
  redirect_uris: [`https://${CUST_APP_HOSTNAME}/api/auth/login/callback`],
  post_logout_redirect_uris: [`https://${CUST_APP_HOSTNAME}/api/auth/logout/callback`],
  response_types: ['code']
});

type DecodedJWTToken = {
  resource_access: {
    [prop: string]: { roles: string[] }
  }
}

const strategyResponder: StrategyVerifyCallbackUserInfo<Express.User> = (tokenSet, userInfo, done) => {
  let roles: string[] = [];

  // Attach client roles to user on login
  // If a user's client roles are ever removed, they should be logged out
  if (tokenSet.access_token) {
    const token = jwtDecode<DecodedJWTToken>(tokenSet.access_token);
    roles = token.resource_access[process.env.KC_CLIENT!]?.roles;
  }

  const { preferred_username: username, given_name: firstName, family_name: lastName, email, sub } = tokenSet.claims();

  const userProfileClaims: Express.User = {
    username,
    firstName,
    lastName,
    email,
    sub,
    roles
  };

  return done(null, userProfileClaims);
}

const keycloakStrategy = new Strategy<Express.User>({ client: keycloakClient }, strategyResponder);

export { 
  keycloak,
  keycloakStrategy,
  realm,
  appClient,
  appRoles
}