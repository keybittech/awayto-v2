import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: '/auth',
  realm: 'devel',
  clientId: 'devel-client'
});

export default keycloak;