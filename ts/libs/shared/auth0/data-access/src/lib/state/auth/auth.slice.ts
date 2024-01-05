import { User as Auth0User } from '@auth0/auth0-react';
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getTokenProps, UserRoles } from '@*company-data-covered*/auth0/util';

export const AUTH_FEATURE_KEY = 'auth';

export type User = Auth0User;

export interface AuthState {
  authToken?: string;
  user?: User;
  userRoles?: UserRoles[];
  userMarkets?: number[];
  marketRole?: string;
}

export const initialAuthState: AuthState = {};

type RootState = unknown & { [AUTH_FEATURE_KEY]: AuthState };

export const authSlice = createSlice({
  name: AUTH_FEATURE_KEY,
  initialState: initialAuthState,
  reducers: {
    setAuthToken(state, action: PayloadAction<Pick<AuthState, 'authToken'>>) {
      const tokenProps = getTokenProps(action.payload.authToken || '');
      state.authToken = action.payload.authToken;
      state.userRoles = tokenProps?.roles;
      state.userMarkets = tokenProps?.markets;
      state.marketRole = tokenProps?.market_role;
    },
    setUser(state, action: PayloadAction<Pick<AuthState, 'user'>>) {
      state.user = action.payload.user;
    },
  },
});

const selectAuthState = (state: RootState) => state[AUTH_FEATURE_KEY];

export const selectAuthToken = createSelector(
  selectAuthState,
  (auth) => auth.authToken
);

export const selectUser = createSelector(selectAuthState, (auth) => auth.user);

export const selectUserMarkets = createSelector(
  selectAuthState,
  (auth) => auth.userMarkets
);

export const selectUserRoles = createSelector(
  selectAuthState,
  (auth) => auth.userRoles
);

export const { setAuthToken, setUser } = authSlice.actions;
