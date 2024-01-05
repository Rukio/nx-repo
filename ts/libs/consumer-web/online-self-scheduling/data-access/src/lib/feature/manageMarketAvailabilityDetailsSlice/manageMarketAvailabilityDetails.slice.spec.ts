import { setupTestStore } from '../../../testUtils';
import {
  buildZipcodePath,
  buildPlacesOfServicePath,
  buildCheckMarketFeasibilityPath,
  mockMarketsAvailabilityZipCodeQuery,
  mockMarketsAvailabilityZipCode,
  mockPlacesOfService,
  mockCheckMarketFeasibilityData,
} from '../../domain';
import { checkMarketAvailabilityDetails } from './manageMarketAvailabilityDetails.slice';

describe('manageMarketAvailabilityDetails.slice', () => {
  describe('thunks', () => {
    describe('checkMarketAvailabilityDetails', () => {
      it.each([
        {
          name: 'falsy isError if successfully checked market availability details',
          mockGetMarketAvailabilityDetailsResponse: () =>
            JSON.stringify({ data: mockMarketsAvailabilityZipCode }),
          mockGetPlacesOfServiceResponse: () =>
            JSON.stringify({ data: mockPlacesOfService }),
          mockGetMarketFeasibilityResponse: () =>
            JSON.stringify({ data: mockCheckMarketFeasibilityData }),
          expectedData: {
            isError: false,
            marketAvailabilityDetails: mockMarketsAvailabilityZipCode,
            placesOfService: mockPlacesOfService,
            marketFeasibilityToday: mockCheckMarketFeasibilityData,
            marketFeasibilityTomorrow: mockCheckMarketFeasibilityData,
          },
        },
        {
          name: 'truthy isError if an error when getting market availability details',
          mockGetMarketAvailabilityDetailsResponse: () => {
            throw new Error();
          },
          mockGetPlacesOfServiceResponse: () =>
            JSON.stringify({ data: mockPlacesOfService }),
          mockGetMarketFeasibilityResponse: () =>
            JSON.stringify({ data: mockCheckMarketFeasibilityData }),
          expectedData: {
            isError: true,
            marketAvailabilityDetails: undefined,
            placesOfService: undefined,
            marketFeasibilityToday: undefined,
            marketFeasibilityTomorrow: undefined,
          },
        },
        {
          name: 'truthy isError if an error when getting places of service',
          mockGetMarketAvailabilityDetailsResponse: () =>
            JSON.stringify({ data: mockMarketsAvailabilityZipCode }),
          mockGetPlacesOfServiceResponse: () => {
            throw new Error();
          },
          mockGetMarketFeasibilityResponse: () =>
            JSON.stringify({ data: mockCheckMarketFeasibilityData }),
          expectedData: {
            isError: true,
            marketAvailabilityDetails: mockMarketsAvailabilityZipCode,
            placesOfService: undefined,
            marketFeasibilityToday: mockCheckMarketFeasibilityData,
            marketFeasibilityTomorrow: mockCheckMarketFeasibilityData,
          },
        },
        {
          name: 'truthy isError if an error when getting market feasibility',
          mockGetMarketAvailabilityDetailsResponse: () =>
            JSON.stringify({ data: mockMarketsAvailabilityZipCode }),
          mockGetPlacesOfServiceResponse: () =>
            JSON.stringify({ data: mockPlacesOfService }),
          mockGetMarketFeasibilityResponse: () => {
            throw new Error();
          },
          expectedData: {
            isError: true,
            marketAvailabilityDetails: mockMarketsAvailabilityZipCode,
            placesOfService: mockPlacesOfService,
            marketFeasibilityToday: undefined,
            marketFeasibilityTomorrow: undefined,
          },
        },
      ])(
        'should return $name',
        async ({
          mockGetMarketAvailabilityDetailsResponse,
          mockGetPlacesOfServiceResponse,
          mockGetMarketFeasibilityResponse,
          expectedData,
        }) => {
          fetchMock.mockOnceIf(
            new RegExp(buildZipcodePath()),
            mockGetMarketAvailabilityDetailsResponse
          );
          fetchMock.mockOnceIf(
            new RegExp(
              buildPlacesOfServicePath(
                mockMarketsAvailabilityZipCode.billingCityId
              )
            ),
            mockGetPlacesOfServiceResponse
          );
          fetchMock.mockIf(
            new RegExp(buildCheckMarketFeasibilityPath()),
            mockGetMarketFeasibilityResponse
          );

          const { store } = setupTestStore();

          const data = await store
            .dispatch(
              checkMarketAvailabilityDetails(
                mockMarketsAvailabilityZipCodeQuery
              )
            )
            .unwrap();

          expect(data).toEqual(expectedData);
        }
      );
    });
  });
});
