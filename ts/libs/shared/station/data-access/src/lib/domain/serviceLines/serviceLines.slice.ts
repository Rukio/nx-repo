import { stationApiSlice } from '../api.slice';
import { ServiceLine } from '../../types';

export const SERVICE_LINES_BASE_PATH = '/api/service_lines';

export const serviceLinesSlice = stationApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getServiceLines: builder.query<ServiceLine[], void>({
      query: () => SERVICE_LINES_BASE_PATH,
    }),
    getServiceLine: builder.query<ServiceLine, string | number>({
      query: (id) => `${SERVICE_LINES_BASE_PATH}/${id}`,
    }),
  }),
});

export const selectServiceLines =
  serviceLinesSlice.endpoints.getServiceLines.select();

export const selectServiceLine = (serviceLineId: number) =>
  serviceLinesSlice.endpoints.getServiceLine.select(serviceLineId);

export const {
  useGetServiceLineQuery,
  useGetServiceLinesQuery,
  useLazyGetServiceLineQuery,
  useLazyGetServiceLinesQuery,
} = serviceLinesSlice;
