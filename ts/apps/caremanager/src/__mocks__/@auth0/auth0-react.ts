export const useAuth0 = () => ({
  isLoading: false,
  isAuthenticated: true,
  loginWithRedirect: () => Promise.resolve(),
  getIdTokenClaims: () => Promise.resolve({ __raw: 'the best token' }),
  getAccessTokenSilently: () => Promise.resolve('the silent token'),
});

export const Auth0Provider = ({ children }: React.PropsWithChildren) => {
  return children;
};

export const withAuthenticationRequired = (children: React.ReactNode) => {
  return children;
};
