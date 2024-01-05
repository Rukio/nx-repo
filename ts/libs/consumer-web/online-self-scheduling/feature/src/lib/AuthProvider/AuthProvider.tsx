import { FC } from 'react';
import {
  Auth0Provider,
  Auth0ProviderOptions,
} from '@*company-data-covered*/auth0/feature';
import { useNavigate } from 'react-router-dom';

export type AuthProviderProps = Omit<
  Auth0ProviderOptions,
  'useCookiesForTransactions' | 'onRedirectCallback'
>;

export const AuthProvider: FC<AuthProviderProps> = (props) => {
  const navigate = useNavigate();

  return (
    <Auth0Provider
      {...props}
      useCookiesForTransactions
      onRedirectCallback={(appState) => {
        navigate(appState?.returnTo || window.location.pathname);
      }}
    />
  );
};

export default AuthProvider;
