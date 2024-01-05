import { stationApiSlice } from '../api.slice';
import { InsuranceClassification } from '../../types';

export const INSURANCE_CLASSIFICATIONS_BASE_PATH =
  '/api/insurance_classifications';

export const insuranceClassificationsSlice = stationApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInsuranceClassifications: builder.query<InsuranceClassification[], void>(
      {
        query: () => INSURANCE_CLASSIFICATIONS_BASE_PATH,
      }
    ),
  }),
});

export const selectInsuranceClassifications =
  insuranceClassificationsSlice.endpoints.getInsuranceClassifications.select();

export const {
  useGetInsuranceClassificationsQuery,
  useLazyGetInsuranceClassificationsQuery,
} = insuranceClassificationsSlice;
