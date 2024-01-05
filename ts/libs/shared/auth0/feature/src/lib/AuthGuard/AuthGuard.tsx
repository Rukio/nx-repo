import { useEffect, ReactElement, FC } from 'react';
import {
  Auth0Provider,
  Auth0ProviderOptions,
  useAuth0,
  RedirectLoginOptions,
  IdToken,
} from '@auth0/auth0-react';
import { CircularProgress, makeSxStyles } from '@*company-data-covered*/design-system';
import {
  selectAuthToken,
  setAuthToken,
} from '@*company-data-covered*/auth0/data-access';
import { useDispatch, useSelector } from 'react-redux';

import testIds from './testIds';

const makeStyles = () =>
  makeSxStyles({
    loaderRoot: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
  });

export type ProtectedContentProps = {
  loadingComponent?: ReactElement;
  redirectOptions?: RedirectLoginOptions;
  useAccessToken?: boolean;
  onAuthorized?: (data?: string | IdToken) => void;
  children: ReactElement;
};
export type AuthGuardProps = Auth0ProviderOptions & ProtectedContentProps;

export const ProtectedContent: FC<ProtectedContentProps> = ({
  children,
  loadingComponent,
  redirectOptions,
  onAuthorized,
  useAccessToken,
}) => {
  const styles = makeStyles();
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    getIdTokenClaims,
    getAccessTokenSilently,
  } = useAuth0();
  const dispatch = useDispatch();
  const authToken = useSelector(selectAuthToken);

  useEffect(() => {
    if ((!isAuthenticated || !user) && !isLoading) {
      loginWithRedirect(redirectOptions);
    }
    if (isAuthenticated && !isLoading) {
      if (useAccessToken) {
        getAccessTokenSilently().then((data) => {
          onAuthorized?.(data);
          dispatch(setAuthToken({ authToken: data }));
        });
      } else {
        getIdTokenClaims().then((data) => {
          onAuthorized?.(data);
          dispatch(setAuthToken({ authToken: data?.__raw }));
        });
      }
    }
  }, [
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    redirectOptions,
    onAuthorized,
    useAccessToken,
    getIdTokenClaims,
    getAccessTokenSilently,
    user,
    dispatch,
  ]);

  if (isLoading || !authToken) {
    return loadingComponent ? (
      loadingComponent
    ) : (
      <CircularProgress
        sx={styles.loaderRoot}
        size={80}
        data-testid={testIds.AUTH_GUARD_LOADER}
      />
    );
  }

  return children;
};

const AuthGuard = ({
  children,
  loadingComponent,
  redirectOptions,
  onAuthorized,
  useAccessToken = false,
  ...providerProps
}: AuthGuardProps) => (
  <Auth0Provider {...providerProps}>
    <ProtectedContent
      redirectOptions={redirectOptions}
      loadingComponent={loadingComponent}
      onAuthorized={onAuthorized}
      useAccessToken={useAccessToken}
    >
      {children}
    </ProtectedContent>
  </Auth0Provider>
);

export default AuthGuard;
