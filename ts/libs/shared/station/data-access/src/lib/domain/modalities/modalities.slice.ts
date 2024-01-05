import { SkipToken } from '@reduxjs/toolkit/query';
import { stationApiSlice } from '../api.slice';
import {
  Modality,
  ModalityConfig,
  MarketModalityConfig,
  NetworkModalityConfig,
} from '../../types';

export const MODALITIES_BASE_PATH = '/api/modalities';
export const MODALITIES_CONFIGS_SEGMENT = '/configs';
export const MODALITIES_MARKETS_CONFIGS_SEGMENT = '/market-configs';
export const MODALITIES_NETWORKS_CONFIGS_SEGMENT = '/network-configs';

export type ModalityConfigWithOptionalId = Omit<ModalityConfig, 'id'> &
  Partial<Pick<ModalityConfig, 'id'>>;

export type MarketModalityConfigWithOptionalId = Omit<
  MarketModalityConfig,
  'id'
> &
  Partial<Pick<MarketModalityConfig, 'id'>>;

export type PatchUpdateModalityConfigsPayload = {
  service_line_id: number;
  configs: ModalityConfigWithOptionalId[];
};

export type PatchUpdateMarketsModalityConfigsPayload = {
  service_line_id: number;
  configs: MarketModalityConfigWithOptionalId[];
};

export type GetNetworksModalityConfigsQuery = {
  service_line_id?: string | number;
  network_id?: string | number;
};

export type IdSelectQuery = string | number | SkipToken;

export const modalitiesSlice = stationApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getModalities: builder.query<Modality[], void>({
      query: () => MODALITIES_BASE_PATH,
      transformResponse: ({ modalities }: { modalities: Modality[] }) =>
        modalities,
    }),
    getModalityConfigs: builder.query<ModalityConfig[], string | number>({
      query: (serviceLineId) => ({
        url: `${MODALITIES_BASE_PATH}${MODALITIES_CONFIGS_SEGMENT}`,
        params: { service_line_id: serviceLineId },
      }),
      transformResponse: ({ configs }) => configs,
    }),
    patchModalityConfigs: builder.mutation<
      ModalityConfig[],
      PatchUpdateModalityConfigsPayload
    >({
      query: (data) => ({
        url: `${MODALITIES_BASE_PATH}${MODALITIES_CONFIGS_SEGMENT}`,
        method: 'PATCH',
        params: { service_line_id: data.service_line_id },
        body: data,
      }),
      transformResponse: ({ configs }) => configs,
    }),
    getMarketsModalityConfigs: builder.query<
      MarketModalityConfig[],
      string | number
    >({
      query: (serviceLineId) => ({
        url: `${MODALITIES_BASE_PATH}${MODALITIES_MARKETS_CONFIGS_SEGMENT}`,
        params: { service_line_id: serviceLineId },
      }),
      transformResponse: ({ configs }) => configs,
    }),
    patchMarketsModalityConfigs: builder.mutation<
      ModalityConfig[],
      PatchUpdateMarketsModalityConfigsPayload
    >({
      query: (data) => ({
        url: `${MODALITIES_BASE_PATH}${MODALITIES_MARKETS_CONFIGS_SEGMENT}`,
        method: 'PATCH',
        params: { service_line_id: data.service_line_id },
        body: data,
      }),
      transformResponse: ({ configs }) => configs,
    }),
    getNetworksModalityConfigs: builder.query<
      NetworkModalityConfig[],
      GetNetworksModalityConfigsQuery | void
    >({
      query: (searchParams) => ({
        url: `${MODALITIES_BASE_PATH}${MODALITIES_NETWORKS_CONFIGS_SEGMENT}`,
        // type void does not match `params` type, but we need to use it
        // in order to avoid pass any params into the query.
        params: searchParams || undefined,
      }),
      transformResponse: ({ configs }: { configs: NetworkModalityConfig[] }) =>
        configs,
    }),
  }),
});

export const selectModalities =
  modalitiesSlice.endpoints.getModalities.select();

export const selectModalityConfigs = (serviceLineId: IdSelectQuery) =>
  modalitiesSlice.endpoints.getModalityConfigs.select(serviceLineId);

export const selectMarketsModalityConfigs = (serviceLineId: IdSelectQuery) =>
  modalitiesSlice.endpoints.getMarketsModalityConfigs.select(serviceLineId);

export const selectNetworksModalityConfigs =
  modalitiesSlice.endpoints.getNetworksModalityConfigs.select;

export const {
  useGetModalitiesQuery,
  useLazyGetModalitiesQuery,
  useGetModalityConfigsQuery,
  useLazyGetModalityConfigsQuery,
  usePatchModalityConfigsMutation,
  useGetMarketsModalityConfigsQuery,
  useLazyGetMarketsModalityConfigsQuery,
  usePatchMarketsModalityConfigsMutation,
  useGetNetworksModalityConfigsQuery,
  useLazyGetNetworksModalityConfigsQuery,
} = modalitiesSlice;
