import { insuranceDashboardApiSlice } from '../apiSlice';
import { DomainState } from '../../types';

export const STATES_API_PATH = 'states';

export const statesSlice = insuranceDashboardApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStates: builder.query<DomainState[], void>({
      query: () => STATES_API_PATH,
      transformResponse: ({ states }: { states: DomainState[] }) => states,
    }),
  }),
});

export const domainSelectStates = statesSlice.endpoints.getStates.select();

export const { useGetStatesQuery, useLazyGetStatesQuery } = statesSlice;
