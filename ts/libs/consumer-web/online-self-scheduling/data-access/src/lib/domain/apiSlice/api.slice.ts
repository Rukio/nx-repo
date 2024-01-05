import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { selectAuthToken } from '@*company-data-covered*/auth0/data-access';
import { RootState } from '../../store';
import { environment } from '../../../environments/environment';

const { serviceURL } = environment;
export const ONLINE_SELF_SCHEDULING_API_SLICE_KEY = 'onlineSelfScheduling';

export enum OnlineSelfSchedulingApiSliceTag {
  CachedSelfScheduleData = 'CachedSelfScheduleData',
  PatientAccount = 'PatientAccount',
  PatientAccountAddresses = 'PatientAccountAddresses',
  PatientAccountPatients = 'PatientAccountPatients',
  Patient = 'Patient',
  PatientInsurances = 'PatientInsurances',
  CareRequest = 'CareRequest',
}

export const onlineSelfSchedulingApiSlice = createApi({
  reducerPath: ONLINE_SELF_SCHEDULING_API_SLICE_KEY,
  tagTypes: [
    OnlineSelfSchedulingApiSliceTag.CachedSelfScheduleData,
    OnlineSelfSchedulingApiSliceTag.PatientAccount,
    OnlineSelfSchedulingApiSliceTag.PatientAccountAddresses,
    OnlineSelfSchedulingApiSliceTag.PatientAccountPatients,
    OnlineSelfSchedulingApiSliceTag.Patient,
    OnlineSelfSchedulingApiSliceTag.PatientInsurances,
    OnlineSelfSchedulingApiSliceTag.CareRequest,
  ],
  baseQuery: fetchBaseQuery({
    baseUrl: serviceURL,
    prepareHeaders: (headers, { getState }) => {
      const token = selectAuthToken(getState() as RootState);
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      return headers;
    },
  }),
  endpoints: () => ({}),
});

export const { middleware } = onlineSelfSchedulingApiSlice;
