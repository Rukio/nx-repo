import { SkipToken } from '@reduxjs/toolkit/query';
import { stationApiSlice } from '../api.slice';
import { InsurancePlan } from '../../types';
import { MARKETS_BASE_PATH } from '../markets';

export const INSURANCE_PLANS_BASE_PATH = '/insurance_plans';
export const INSURANCE_PLANS_SEARCH_SEGMENT = '/search';

export type SearchInsurancePlansQuery = {
  marketId: string | number;
  search?: string;
  classificationId?: string | number;
};

export type SelectSearchInsurancePlansQuery =
  | SearchInsurancePlansQuery
  | SkipToken;

export const insurancePlansSlice = stationApiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInsurancePlans: builder.query<
      InsurancePlan[],
      SearchInsurancePlansQuery
    >({
      query: ({ marketId, search, classificationId }) => ({
        url: `${MARKETS_BASE_PATH}/${marketId}${INSURANCE_PLANS_BASE_PATH}${INSURANCE_PLANS_SEARCH_SEGMENT}`,
        params: { search, classification_id: classificationId },
      }),
    }),
  }),
});

export const selectInsurancePlans = (query: SelectSearchInsurancePlansQuery) =>
  insurancePlansSlice.endpoints.getInsurancePlans.select(query);

export const { useGetInsurancePlansQuery, useLazyGetInsurancePlansQuery } =
  insurancePlansSlice;
