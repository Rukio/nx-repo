import { State } from '@*company-data-covered*/consumer-web-types';
import { onlineSelfSchedulingApiSlice } from '../apiSlice';

const STATES_API_PATH = 'states';
const ACTIVE_SEGMENT = '/active';

export const buildStatesPath = () => `${STATES_API_PATH}${ACTIVE_SEGMENT}`;

export const statesSlice = onlineSelfSchedulingApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStates: builder.query<State[], void>({
      query: () => buildStatesPath(),
      transformResponse: ({ data }: { data: State[] }) => data,
    }),
  }),
});
export const domainSelectStates = statesSlice.endpoints.getStates.select();

export const { useGetStatesQuery } = statesSlice;
