import { insuranceDashboardApiSlice } from '../apiSlice';
import {
  NetworkModalityConfig,
  PatchNetworkModalityConfigPayload,
} from '../../types';
import { NETWORKS_API_PATH } from '../networksSlice';
import { API_CACHE_TAGS } from '../../utils/constants';

export const MODALITY_CONFIGS_API_FRAGMENT = 'modality_configs';

export const buildNetworkModalityConfigsPath = (networkId: string | number) => {
  return `${NETWORKS_API_PATH}/${networkId}/${MODALITY_CONFIGS_API_FRAGMENT}`;
};

export const networkModalitiesSlice =
  insuranceDashboardApiSlice.injectEndpoints({
    endpoints: (builder) => ({
      getNetworkModalityConfigs: builder.query<
        NetworkModalityConfig[],
        string | number
      >({
        query: buildNetworkModalityConfigsPath,
        transformResponse: ({
          configs,
        }: {
          configs: NetworkModalityConfig[];
        }) => configs,
        providesTags: [API_CACHE_TAGS.NetworkModalityConfigs],
      }),
      patchNetworkModalityConfigs: builder.mutation<
        NetworkModalityConfig[],
        PatchNetworkModalityConfigPayload
      >({
        query: ({ networkId, configs }) => ({
          url: buildNetworkModalityConfigsPath(networkId),
          method: 'PATCH',
          body: { configs },
        }),
        transformResponse: ({
          configs,
        }: {
          configs: NetworkModalityConfig[];
        }) => configs,
        invalidatesTags: [API_CACHE_TAGS.NetworkModalityConfigs],
      }),
    }),
  });

export const selectDomainNetworkModalityConfigs =
  networkModalitiesSlice.endpoints.getNetworkModalityConfigs.select;

export const {
  useGetNetworkModalityConfigsQuery,
  usePatchNetworkModalityConfigsMutation,
} = networkModalitiesSlice;
