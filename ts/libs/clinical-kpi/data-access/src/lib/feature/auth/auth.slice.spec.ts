import { RootState } from '../../store';
import {
  authSlice,
  initialAuthState,
  setAccessToken,
  setUser,
  User,
  selectAuthAccessToken,
  selectAuthUser,
  AUTH_FEATURE_KEY,
  selectUserMarketRole,
} from './auth.slice';

const testUser: User = {
  given_name: 'joe',
  family_name: 'testuser',
  nickname: 'joe@*company-data-covered*.com',
  name: 'joe testuser',
  picture: 'pictureurl',
};

const testToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJodHRwczovL2Rpc3BhdGNoaGVhbHRoLmNvbS9wcm9wcyI6eyJtYXJrZXRfcm9sZSI6Ik1hcmtldCBNYW5hZ2VyIn19.gsuIDIVv3ZdVYwTWYcG4gqB0wDK68KxrK2VNp7nefpA';

const testState: Pick<RootState, 'auth'> = {
  [AUTH_FEATURE_KEY]: { user: testUser, accessToken: testToken },
};

describe('auth slice', () => {
  it('should handle initial state', () => {
    const result = authSlice.reducer(undefined, {
      type: undefined,
    });
    expect(result).toEqual(initialAuthState);
  });

  describe('reducer', () => {
    it('should handle set token', () => {
      const result = authSlice.reducer(
        undefined,
        setAccessToken({ accessToken: testToken })
      );
      expect(result).toEqual({ ...initialAuthState, accessToken: testToken });
    });

    it('should handle set user', () => {
      const result = authSlice.reducer(undefined, setUser({ user: testUser }));
      expect(result).toEqual({ ...initialAuthState, user: testUser });
    });
  });

  describe('selectors', () => {
    it('should select token', () => {
      const result = selectAuthAccessToken(testState);
      expect(result).toEqual(testToken);
    });

    it('should select user', () => {
      const result = selectAuthUser(testState);
      expect(result).toEqual(testUser);
    });

    it('should select marketRole', () => {
      const result = selectUserMarketRole(testState);
      expect(result).toEqual('Market Manager');
    });

    it('should select marketRole null if token is not defined', () => {
      const result = selectUserMarketRole({
        ...testState,
        [AUTH_FEATURE_KEY]: {},
      });
      expect(result).toEqual(null);
    });
  });
});
