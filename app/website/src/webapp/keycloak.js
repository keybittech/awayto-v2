import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
  url: '/auth',
  realm: 'devel',
  clientId: 'devel-client'
});

export async function initKeycloak() {

  void keycloak.init({
    onLoad: 'login-required',
    checkLoginIframe: false
  }).then((authenticated) => {
    if (authenticated) {
      this.cb();
    }
  }).catch((err) => {
    console.log({ err })
  })

}

export default keycloak;