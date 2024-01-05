import { insuranceDashboardApiSlice } from '../apiSlice';
import { DomainServiceLine } from '../../types';

export const SERVICE_LINES_API_PATH = 'service_lines';

export const serviceLinesSlice = insuranceDashboardApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getServiceLines: builder.query<DomainServiceLine[], void>({
      query: () => SERVICE_LINES_API_PATH,
      transformResponse: ({
        serviceLines,
      }: {
        serviceLines: DomainServiceLine[];
      }) => serviceLines,
    }),
  }),
});

export const domainSelectServiceLines =
  serviceLinesSlice.endpoints.getServiceLines.select();

export const { useGetServiceLinesQuery } = serviceLinesSlice;
