import { insuranceDashboardApiSlice } from '../apiSlice';
import { InsuranceClassification } from '../../types';

export const INSURANCE_CLASSIFICATIONS_API_PATH = 'insurance_classifications';

export const insuranceClassificationsSlice =
  insuranceDashboardApiSlice.injectEndpoints({
    endpoints: (builder) => ({
      getInsuranceClassifications: builder.query<
        InsuranceClassification[],
        void
      >({
        query: () => `${INSURANCE_CLASSIFICATIONS_API_PATH}`,
        transformResponse: ({
          insuranceClassifications,
        }: {
          insuranceClassifications: InsuranceClassification[];
        }) => insuranceClassifications,
      }),
    }),
  });

export const selectInsuranceClassifications =
  insuranceClassificationsSlice.endpoints.getInsuranceClassifications.select();

export const {
  useGetInsuranceClassificationsQuery,
  useLazyGetInsuranceClassificationsQuery,
} = insuranceClassificationsSlice;
