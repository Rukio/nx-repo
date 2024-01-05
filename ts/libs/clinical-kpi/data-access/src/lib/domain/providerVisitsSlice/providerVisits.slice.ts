import { clinicalKpiApiSlice } from '../apiSlice';
import {
  LeaderHubIndividualProviderVisitsQueryParams,
  LeaderHubIndividualProviderVisitsResponse,
} from '../../types';
import { LEADS_PROVIDERS_API_PATH } from '../constants';

export const getProviderLatestVisitsPath = (id: string) => {
  return `${LEADS_PROVIDERS_API_PATH}/${id}/visits`;
};

export const providerVisitsSlice = clinicalKpiApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProviderVisits: builder.query<
      LeaderHubIndividualProviderVisitsResponse,
      LeaderHubIndividualProviderVisitsQueryParams
    >({
      query: ({ id, ...params }) => ({
        url: getProviderLatestVisitsPath(id),
        params,
      }),
    }),
  }),
});

export const { useGetProviderVisitsQuery } = providerVisitsSlice;
