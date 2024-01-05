import { useAuth0 } from '@auth0/auth0-react';
import { FC, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  setAccessToken,
  setUser,
  selectAuthAccessToken,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { LoadingContainer } from '@*company-data-covered*/clinical-kpi/ui';

export interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard: FC<AuthGuardProps> = ({ children }: AuthGuardProps) => {
  const {
    user,
    isAuthenticated,
    loginWithRedirect,
    isLoading,
    getAccessTokenSilently,
  } = useAuth0();

  const accessToken = useSelector(selectAuthAccessToken);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setUser({ user }));
  }, [user, dispatch]);

  useEffect(() => {
    if ((!isAuthenticated || !user) && !isLoading) {
      loginWithRedirect();
    }
  }, [isAuthenticated, user, isLoading, loginWithRedirect]);

  useEffect(() => {
    const getAuthToken = async () => {
      try {
        const accessToken = await getAccessTokenSilently();
        dispatch(setAccessToken({ accessToken: accessToken ?? '' }));
      } catch {
        loginWithRedirect();
      }
    };
    if (!isLoading && isAuthenticated) {
      getAuthToken();
    }
  }, [
    dispatch,
    getAccessTokenSilently,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
  ]);

  return accessToken ? (
    <>{children}</>
  ) : (
    <LoadingContainer testIdPrefix="authguard" />
  );
};

export default AuthGuard;
