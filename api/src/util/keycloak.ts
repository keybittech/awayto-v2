

import KcAdminClient from '@keycloak/keycloak-admin-client';
import { Issuer, Strategy, StrategyVerifyCallbackUserInfo } from 'openid-client';
import { Credentials } from '@keycloak/keycloak-admin-client/lib/utils/auth';

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
  await keycloak.auth(credentials);
} catch (error) {
  console.log('init error', error)
}

setInterval(() => keycloak.auth(credentials), 58 * 1000); // 58 seconds

// KC Passport & OIDC Client
const keycloakIssuer = await Issuer.discover(`https://${CUST_APP_HOSTNAME}/auth/realms/${KC_REALM}`);
const keycloakClient = new keycloakIssuer.Client({
  client_id: KC_API_CLIENT_ID,
  client_secret: KC_API_CLIENT_SECRET,
  redirect_uris: [`https://${CUST_APP_HOSTNAME}/api/auth/login/callback`],
  post_logout_redirect_uris: [`https://${CUST_APP_HOSTNAME}/api/auth/logout/callback`],
  response_types: ['code']
});

const strategyResponder: StrategyVerifyCallbackUserInfo<Express.User> = (tokenSet, userInfo, done) => {
  const { preferred_username: username, given_name: firstName, family_name: lastName, email, sub } = tokenSet.claims();
  
  console.log({ claims: tokenSet.claims(), userInfo })

  const userProfileClaims: Express.User = {
    username,
    firstName,
    lastName,
    email,
    sub
  };

  return done(null, userProfileClaims);
}

const keycloakStrategy = new Strategy<Express.User>({ client: keycloakClient }, strategyResponder);

export { 
  keycloak,
  keycloakStrategy
}