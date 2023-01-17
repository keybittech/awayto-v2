import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: '/auth',
  realm: 'devel',
  clientId: 'devel-client'
});

const initKeycloak = async (onAuthCallback) => {
  const authenticated = await keycloak.init({
    onLoad: 'check-sso',
    silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
  });

  if (authenticated) {
    onAuthCallback();
  }
}

export default keycloak;