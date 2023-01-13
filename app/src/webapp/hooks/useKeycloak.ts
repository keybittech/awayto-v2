import Keycloak from 'keycloak-js';
import { useMemo } from 'react';

export function useKeycloak(): Keycloak {
  const comps = useMemo(() => {
    const keycloak = new Keycloak({
      url: 'https://192.168.1.53:8443/',
      realm: 'devel',
      clientId: 'devel-client'
    });
    async function go() {
      await keycloak.init({
        onLoad: 'login-required'
      });
    }
    void go();
    return keycloak;
  }, []);
  return comps;
}
