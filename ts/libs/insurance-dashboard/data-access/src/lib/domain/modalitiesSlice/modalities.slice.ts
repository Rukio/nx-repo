import { insuranceDashboardApiSlice } from '../apiSlice';
import { Modality } from '../../types';

export const MODALITIES_API_PATH = 'modalities';

export const buildModalitiesPath = () => {
  return `${MODALITIES_API_PATH}`;
};

export const modalitiesSlice = insuranceDashboardApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getModalities: builder.query<Modality[], void>({
      query: () => MODALITIES_API_PATH,
      transformResponse: ({ modalities }: { modalities: Modality[] }) =>
        modalities,
    }),
  }),
});

export const selectDomainModalities =
  modalitiesSlice.endpoints.getModalities.select();

export const { useGetModalitiesQuery } = modalitiesSlice;
