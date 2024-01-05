import {
  UnauthenticatedCareRequestResult,
  CreateUnauthenticatedCareRequestDataPayload,
} from '../../types';
import { stationApiSlice } from '../api.slice';

export const CARE_REQUESTS_BASE_PATH = '/api/unauthenticated/care_requests';

export const unauthenticatedCareRequestsSlice = stationApiSlice.injectEndpoints(
  {
    endpoints: (builder) => ({
      createCareRequest: builder.mutation<
        UnauthenticatedCareRequestResult,
        CreateUnauthenticatedCareRequestDataPayload
      >({
        query: (data) => ({
          url: CARE_REQUESTS_BASE_PATH,
          method: 'POST',
          body: data,
        }),
      }),
    }),
  }
);

export const { useCreateCareRequestMutation } =
  unauthenticatedCareRequestsSlice;
