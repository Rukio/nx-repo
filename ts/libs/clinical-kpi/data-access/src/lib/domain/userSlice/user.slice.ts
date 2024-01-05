import { clinicalKpiApiSlice } from '../apiSlice';
import { AuthenticatedUser } from '../../types';
import { createSelector } from '@reduxjs/toolkit';
import { sortMarketsAlphabetically } from './utils';

export const CURRENT_USER_BASE_PATH = 'users/me';

export const userSlice = clinicalKpiApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAuthenticatedUser: builder.query<AuthenticatedUser | null, void>({
      query: () => CURRENT_USER_BASE_PATH,
      transformResponse: ({ user }: { user: AuthenticatedUser | null }) => user,
    }),
  }),
});

export const { useGetAuthenticatedUserQuery } = userSlice;

export const selectAuthenticatedUser =
  userSlice.endpoints.getAuthenticatedUser.select();

export const selectAuthenticatedUserId = createSelector(
  selectAuthenticatedUser,
  ({ data, isLoading, isError }) => ({
    isLoading,
    isError,
    userId: data?.id,
  })
);

export const selectAuthenticatedUserFirstname = createSelector(
  selectAuthenticatedUser,
  ({ data, isLoading, isError }) => ({
    isLoading,
    isError,
    firstName: data?.firstName,
  })
);

export const selectAuthenticatedUserMarkets = createSelector(
  selectAuthenticatedUser,
  ({ data, isLoading, isError }) => ({
    isLoading,
    isError,
    markets: data?.markets,
  })
);

export const selectAuthenticatedUserSortedMarkets = createSelector(
  selectAuthenticatedUser,
  ({ data, isLoading, isError }) => ({
    isLoading,
    isError,
    markets: data?.markets && sortMarketsAlphabetically(data?.markets),
  })
);

export const selectAuthenticatedUserPosition = createSelector(
  selectAuthenticatedUser,
  ({ data, isLoading, isError }) => ({
    isLoading,
    isError,
    userPosition: data?.providerProfile.position,
  })
);
