import React, { useEffect, useMemo, useRef, useState } from 'react';

import { useAppSelector, useContexts, useAuth, useComponents } from 'awayto/hooks';

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

function AuthProvider(): React.JSX.Element {

  const { AuthContext } = useContexts();
  const { App } = useComponents();

  const [init, setInit] = useState(false);

  const { authenticated } = useAppSelector(state => state.auth);
  const { setAuthenticated } = useAuth();

  const refreshToken = async () => {
    const refreshed = await keycloak.updateToken(-1);
    localStorage.setItem('kc_token', keycloak.token as string);
    localStorage.setItem('kc_refreshToken', keycloak.refreshToken as string);
    return refreshed;
  }

  useEffect(() => {
    const token = localStorage.getItem('kc_token') as string;
    const refreshToken = localStorage.getItem('kc_refreshToken') as string;
  
    void keycloak.init({
      onLoad: 'login-required',
      checkLoginIframe: false,
      token,
      refreshToken
    }).then(async (currentAuth) => {
      
      setInterval(() => void keycloak.updateToken(58), 58 * 1000);
      
      if (currentAuth) {
        localStorage.setItem('kc_token', keycloak.token as string);
        localStorage.setItem('kc_refreshToken', keycloak.refreshToken as string);
        
        await fetch('/api/auth/checkin', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keycloak.token as string}`
          }
        });
      }
      
      setAuthenticated({ authenticated: currentAuth });
      setInit(true);
    }).catch((err) => {
      console.log({ err: err as string });
    });
  }, []);

  const authContext = {
    authenticated,
    keycloak,
    refreshToken
  } as AuthContextType;

  return useMemo(() => !AuthContext || !init ? <></> : 
    <AuthContext.Provider value={authContext}>
      <App />
    </AuthContext.Provider>, 
    [AuthContext, authContext, init]
  );
}

export default AuthProvider;