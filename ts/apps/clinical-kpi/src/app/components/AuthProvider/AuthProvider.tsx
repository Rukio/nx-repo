import { ReactNode } from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import { environment } from '../../../environments/environment';

type Props = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: Props) => {
  const { auth0Domain, auth0Audience, auth0ClientId } = environment;

  return (
    <Auth0Provider
      domain={auth0Domain}
      clientId={auth0ClientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: auth0Audience,
      }}
      cacheLocation={window.Cypress ? 'localstorage' : 'memory'}
    >
      {children}
    </Auth0Provider>
  );
};

export default AuthProvider;
