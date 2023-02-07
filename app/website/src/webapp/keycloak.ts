import { ApiResponse } from 'awayto';
import Keycloak from 'keycloak-js';

const {
  REACT_APP_KC_REALM,
  REACT_APP_KC_CLIENT,
  REACT_APP_KC_PATH
} = process.env as { [prop: string]: string };

const keycloak = new Keycloak({
  url: REACT_APP_KC_PATH,
  realm: REACT_APP_KC_REALM,
  clientId: REACT_APP_KC_CLIENT
});

export function initKeycloak(this: { cb: () => void }): void {

  const token = localStorage.getItem('kc_token') as string;
  const refreshToken = localStorage.getItem('kc_refreshToken') as string;

  void keycloak.init({
    onLoad: 'login-required',
    checkLoginIframe: false,
    token,
    refreshToken

  }).then(async (authenticated) => {
    if (authenticated) {
      localStorage.setItem('kc_token', keycloak.token as string);
      localStorage.setItem('kc_refreshToken', keycloak.refreshToken as string);

      await fetch('/api/auth/checkin', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keycloak.token as string}`
        }
      } as RequestInit) as ApiResponse;

      this.cb();
    }
  }).catch((err) => {
    console.log({ err: err as string })
  })

}

export default keycloak;