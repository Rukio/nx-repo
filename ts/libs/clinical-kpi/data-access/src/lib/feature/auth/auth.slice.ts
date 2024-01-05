import { User as Auth0User } from '@auth0/auth0-react';
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getTokenProps } from '@*company-data-covered*/auth0/util';

import { RootState } from '../../store';

export const AUTH_FEATURE_KEY = 'auth';

export type User = Auth0User;

export interface AuthState {
  accessToken?: string;
  user?: User;
}

export const initialAuthState: AuthState = {};

export const authSlice = createSlice({
  name: AUTH_FEATURE_KEY,
  initialState: initialAuthState,
  reducers: {
    setAccessToken(
      state,
      action: PayloadAction<Pick<AuthState, 'accessToken'>>
    ) {
      state.accessToken = action.payload.accessToken;
    },
    setUser(state, action: PayloadAction<Pick<AuthState, 'user'>>) {
      state.user = action.payload.user;
    },
  },
});

const selectAuthState = (currentState: Pick<RootState, 'auth'>) =>
  currentState.auth;

export const selectAuthAccessToken = createSelector(
  selectAuthState,
  (auth) => auth.accessToken
);

export const selectAuthUser = createSelector(
  selectAuthState,
  (auth) => auth.user
);

export const selectUserMarketRole = createSelector(
  selectAuthAccessToken,
  (accessToken) => {
    if (!accessToken) {
      return null;
    }
    const tokenProps = getTokenProps(accessToken);

    return tokenProps?.market_role;
  }
);

export const { setAccessToken, setUser } = authSlice.actions;
