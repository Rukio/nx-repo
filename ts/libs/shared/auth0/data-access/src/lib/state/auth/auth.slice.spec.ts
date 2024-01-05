import {
  authSlice,
  initialAuthState,
  selectAuthToken,
  AUTH_FEATURE_KEY,
  setAuthToken,
  setUser,
  User,
  selectUser,
  AuthState,
  selectUserMarkets,
  selectUserRoles,
} from './auth.slice';
import { UserRoles } from '@*company-data-covered*/auth0/util';

const mockedToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2Rpc3BhdGNoaGVhbHRoLmNvbS9wcm9wcyI6eyJyb2xlcyI6WyJhZG1pbiJdLCJtYXJrZXRzIjpbMV0sIm1hcmtldF9yb2xlIjoiYWRtaW4ifSwiaWF0IjoxNjkzODI2MzkzfQ.I_GE5rrhIfb38J04DbxLAI3V8xmhl2vuq8NbeHQXAeA';
const mockedUser: User = {
  given_name: 'name_1',
  family_name: 'name_2',
  nickname: 'name_1@*company-data-covered*.com',
  name: 'name_1 name_2',
  picture: 'test_url',
};
const mockedRoles = [UserRoles.ADMIN];
const mockedMarkets = [1];
const mockedMarketRole = 'admin';
const mockedEmptyToken = 'empty-token';

const mockedState: {
  [AUTH_FEATURE_KEY]: AuthState;
} = {
  [AUTH_FEATURE_KEY]: {
    user: mockedUser,
    authToken: mockedToken,
    userRoles: mockedRoles,
    userMarkets: mockedMarkets,
  },
};

describe('auth slice', () => {
  it('should initialize default reducer state', () => {
    const state = authSlice.reducer(undefined, { type: undefined });
    expect(state).toEqual(initialAuthState);
  });

  describe('reducer', () => {
    it('should handle set token', () => {
      const state = authSlice.reducer(
        undefined,
        setAuthToken({ authToken: mockedToken })
      );
      expect(state).toEqual({
        ...initialAuthState,
        authToken: mockedToken,
        userRoles: mockedRoles,
        userMarkets: mockedMarkets,
        marketRole: mockedMarketRole,
      });
    });

    it('should handle set user', () => {
      const state = authSlice.reducer(undefined, setUser({ user: mockedUser }));
      expect(state).toEqual({ ...initialAuthState, user: mockedUser });
    });

    it('should handle set token with empty values', () => {
      const state = authSlice.reducer(
        undefined,
        setAuthToken({ authToken: mockedEmptyToken })
      );

      expect(state).toEqual({
        ...initialAuthState,
        authToken: mockedEmptyToken,
      });
    });
  });

  describe('selectors', () => {
    it('should select token', () => {
      const token = selectAuthToken(mockedState);
      expect(token).toEqual(token);
    });

    it('should select user', () => {
      const user = selectUser(mockedState);
      expect(user).toEqual(mockedUser);
    });

    it('should select user roles', () => {
      const roles = selectUserRoles(mockedState);
      expect(roles).toEqual(mockedRoles);
    });

    it('should select user markets', () => {
      const markets = selectUserMarkets(mockedState);
      expect(markets).toEqual(mockedMarkets);
    });
  });
});
