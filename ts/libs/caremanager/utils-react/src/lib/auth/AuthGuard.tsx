import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { datadogRum } from '@datadog/browser-rum';
import { useAnalytics } from '../analytics/useAnalytics';

export const AuthContext = createContext<string | undefined>(undefined);

export const useAuth0Token = () => useContext(AuthContext);

export interface AuthGuardProps {
  redirectUri?: string;
  children: typeof React.Children | React.ReactElement;
}

export const AuthGuard = React.memo<React.PropsWithChildren<AuthGuardProps>>(
  ({ redirectUri, children }): JSX.Element | null => {
    const {
      user,
      isAuthenticated,
      loginWithRedirect,
      isLoading,
      getAccessTokenSilently,
    } = useAuth0();
    const { identifyUser } = useAnalytics();
    const [auth0Token, setAuth0Token] = useState<string>();

    useEffect(() => {
      if ((!isAuthenticated || !user) && !isLoading) {
        loginWithRedirect().catch((error) => console.error(error));
      }
    }, [loginWithRedirect, redirectUri, isAuthenticated, user, isLoading]);

    useEffect(() => {
      if (!isLoading && isAuthenticated) {
        datadogRum.setUser({
          email: user?.email,
          name: user?.name,
        });
        identifyUser(user?.email || 'no-email-for-user', {
          email: user?.email,
          avatar: user?.picture,
          birthday: user?.birthdate,
          firstName: user?.given_name,
          lastName: user?.family_name,
          phone: user?.phone_number,
        });
        getAccessTokenSilently()
          .then(setAuth0Token)
          .catch(async () => {
            await loginWithRedirect({
              authorizationParams: { redirect_uri: redirectUri },
            });
          });
      }
    }, [
      getAccessTokenSilently,
      loginWithRedirect,
      redirectUri,
      isAuthenticated,
      isLoading,
      user?.email,
      user?.name,
      user?.picture,
      user?.birthdate,
      user?.given_name,
      user?.family_name,
      user?.phone_number,
      identifyUser,
    ]);

    return (
      <AuthContext.Provider value={auth0Token}>{children}</AuthContext.Provider>
    );
  }
);
