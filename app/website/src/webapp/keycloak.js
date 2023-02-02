import Keycloak from 'keycloak-js';

const {
  REACT_APP_KC_REALM,
  REACT_APP_KC_CLIENT,
  REACT_APP_KC_PATH
} = process.env;

const keycloak = new Keycloak({
  url: REACT_APP_KC_PATH,
  realm: REACT_APP_KC_REALM,
  clientId: REACT_APP_KC_CLIENT
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