import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState, Auth0Provider } from '@auth0/auth0-react';

type Props = React.PropsWithChildren & {
  auth0Domain: string;
  auth0ClientId: string;
  auth0Audience: string;
};

export const Auth0ProviderWithHistory: React.FC<Props> = ({
  children,
  auth0Domain,
  auth0ClientId,
  auth0Audience,
}) => {
  if (!auth0Domain || !auth0ClientId || !auth0Audience) {
    throw Error(
      'Missing Auth0 config: either "auth0Domain", "auth0ClientId" or "auth0Audience" are missing from the environment variables'
    );
  }

  const navigate = useNavigate();

  const onRedirectCallback = useCallback(
    (appState?: AppState) => {
      navigate(appState?.returnTo || window.location.pathname);
    },
    [navigate]
  );

  return (
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: auth0Audience,
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
};
