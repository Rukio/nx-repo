import { BillingCityPlaceOfService } from '@*company-data-covered*/consumer-web-types';
import { createAsyncThunk } from '@reduxjs/toolkit';
import { format, startOfToday, startOfTomorrow } from 'date-fns';
import {
  useGetMarketsAvailabilityZipCodeQuery,
  marketsAvailabilitySlice,
  selfScheduleSlice,
} from '../../domain';
import {
  CheckMarketFeasibilityData,
  DomainMarketsAvailabilityZipCode,
  MarketsAvailabilityZipCodeQuery,
} from '../../types';

export const MANAGE_MARKET_AVAILABILITY_DETAILS_SLICE_KEY =
  'manageMarketAvailabilityDetails';

export const checkMarketAvailabilityDetails = createAsyncThunk<
  {
    isError: boolean;
    marketAvailabilityDetails?: DomainMarketsAvailabilityZipCode;
    placesOfService?: BillingCityPlaceOfService[];
    marketFeasibilityToday?: CheckMarketFeasibilityData;
    marketFeasibilityTomorrow?: CheckMarketFeasibilityData;
  },
  MarketsAvailabilityZipCodeQuery
>(
  `${MANAGE_MARKET_AVAILABILITY_DETAILS_SLICE_KEY}/checkMarketAvailabilityDetails`,
  async (zipCodeQuery, { dispatch }) => {
    const marketAvailabilityDetailsResponse = await dispatch(
      marketsAvailabilitySlice.endpoints.getMarketsAvailabilityZipCode.initiate(
        zipCodeQuery
      )
    );

    const [
      placesOfServiceResponse,
      marketFeasibilityTodayResponse,
      marketFeasibilityTomorrowResponse,
    ] =
      marketAvailabilityDetailsResponse.isSuccess &&
      !!marketAvailabilityDetailsResponse.data
        ? await Promise.all([
            dispatch(
              selfScheduleSlice.endpoints.getPlacesOfService.initiate({
                billingCityId:
                  marketAvailabilityDetailsResponse.data.billingCityId,
              })
            ),
            dispatch(
              selfScheduleSlice.endpoints.checkMarketFeasibility.initiate({
                zipcode: zipCodeQuery.zipCode.toString(),
                marketId: marketAvailabilityDetailsResponse.data.marketId,
                date: format(startOfToday(), 'MM-dd-yyyy'),
              })
            ),
            dispatch(
              selfScheduleSlice.endpoints.checkMarketFeasibility.initiate({
                zipcode: zipCodeQuery.zipCode.toString(),
                marketId: marketAvailabilityDetailsResponse.data.marketId,
                date: format(startOfTomorrow(), 'MM-dd-yyyy'),
              })
            ),
          ])
        : [];

    const isPlacesOfServiceResponseError =
      !placesOfServiceResponse || placesOfServiceResponse?.isError;

    const isMarketFeasibilityTodayResponseError =
      !marketFeasibilityTodayResponse ||
      marketFeasibilityTodayResponse?.isError;

    const isMarketFeasibilityTomorrowResponseError =
      !marketFeasibilityTomorrowResponse ||
      marketFeasibilityTomorrowResponse?.isError;

    return {
      isError:
        marketAvailabilityDetailsResponse.isError ||
        isPlacesOfServiceResponseError ||
        isMarketFeasibilityTodayResponseError ||
        isMarketFeasibilityTomorrowResponseError,
      marketAvailabilityDetails: marketAvailabilityDetailsResponse.data,
      placesOfService: placesOfServiceResponse?.data,
      marketFeasibilityToday: marketFeasibilityTodayResponse?.data,
      marketFeasibilityTomorrow: marketFeasibilityTomorrowResponse?.data,
    };
  }
);

export { useGetMarketsAvailabilityZipCodeQuery };
