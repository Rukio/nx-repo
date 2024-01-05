import { environment } from '../../../environments/environment';
import { setupTestStore } from '../../../testUtils';
import { ServiceAreaAvailability } from '../../types';
import { STATION_API_SLICE_KEY } from '../api.slice';
import { mockServiceAreaAvailabilityQuery } from './mocks';
import {
  selectServiceAreaAvailability,
  serviceAreasSlice,
  getServiceAreaAvailabilityURL,
  ServiceAreaAvailabilityQuery,
} from './serviceAreas.slice';
import {
  testApiErrorResponse,
  testApiSuccessResponse,
} from '@*company-data-covered*/shared/testing/rtk';

const { stationURL } = environment;

describe('serviceAreas.slice', () => {
  describe('getServiceAreaAvailability', () => {
    it('should make correct API call', async () => {
      const store = setupTestStore();
      await store.dispatch(
        serviceAreasSlice.endpoints.getServiceAreaAvailability.initiate(
          mockServiceAreaAvailabilityQuery
        )
      );
      expect(fetchMock).toBeCalledTimes(1);
      const { method, url } = fetchMock.mock.calls[0][0] as Request;

      expect(method).toEqual('GET');
      expect(url).toEqual(
        `${stationURL}${getServiceAreaAvailabilityURL(
          mockServiceAreaAvailabilityQuery.zipcode,
          mockServiceAreaAvailabilityQuery.clientTime
        )}`
      );
    });

    it('successful response', async () => {
      fetchMock.mockResponse(JSON.stringify(true));
      const store = setupTestStore();

      const action = await store.dispatch(
        serviceAreasSlice.endpoints.getServiceAreaAvailability.initiate(
          mockServiceAreaAvailabilityQuery
        )
      );
      testApiSuccessResponse(action, true);
    });

    it('unsuccessful response', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      const action = await store.dispatch(
        serviceAreasSlice.endpoints.getServiceAreaAvailability.initiate(
          mockServiceAreaAvailabilityQuery
        )
      );
      testApiErrorResponse(action, 'Failed');
    });

    it('should select service area availability from store', async () => {
      fetchMock.mockResponse(JSON.stringify(true));
      const store = setupTestStore();
      await store.dispatch(
        serviceAreasSlice.endpoints.getServiceAreaAvailability.initiate(
          mockServiceAreaAvailabilityQuery
        )
      );

      const { data: serviceAreaAvailabilityFromState } =
        selectServiceAreaAvailability(mockServiceAreaAvailabilityQuery)(
          store.getState()
        );
      expect(serviceAreaAvailabilityFromState).toEqual(true);
    });

    it('should not serialize clientTime arg and store cached data', async () => {
      fetchMock.mockResponse(JSON.stringify(true));
      const store = setupTestStore();
      await store.dispatch(
        serviceAreasSlice.endpoints.getServiceAreaAvailability.initiate(
          mockServiceAreaAvailabilityQuery
        )
      );

      const {
        data: serviceAreaAvailabilityFromState,
        endpointName: serviceAreaAvailabilityEndpointName,
        originalArgs: serviceAreaAvailabilityOriginalArgs,
      } = selectServiceAreaAvailability(mockServiceAreaAvailabilityQuery)(
        store.getState()
      );

      const queryCacheKey = `${serviceAreaAvailabilityEndpointName}(${JSON.stringify(
        {
          zipcode: mockServiceAreaAvailabilityQuery.zipcode,
        }
      )})`;

      const {
        data: serviceAreaAvailabilityQueryData,
        originalArgs: serviceAreaAvailabilityQueryOriginalArgs,
      }: {
        data: ServiceAreaAvailability;
        originalArgs: ServiceAreaAvailabilityQuery;
      } = store.getState()[STATION_API_SLICE_KEY].queries[queryCacheKey];

      expect(serviceAreaAvailabilityQueryData).toBe(
        serviceAreaAvailabilityFromState
      );
      expect(serviceAreaAvailabilityQueryOriginalArgs).toBe(
        serviceAreaAvailabilityOriginalArgs
      );
    });
  });
});
