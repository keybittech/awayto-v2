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

  const token = localStorage.getItem('kc_token');
  const refreshToken = localStorage.getItem('kc_refreshToken');

  void keycloak.init({
    onLoad: 'login-required',
    checkLoginIframe: false,
    token,
    refreshToken

  }).then((authenticated) => {
    if (authenticated) {
      localStorage.setItem('kc_token', keycloak.token);
      localStorage.setItem('kc_refreshToken', keycloak.refreshToken);

      this.cb();
    }
  }).catch((err) => {
    console.log({ err })
  })

}

export default keycloak;