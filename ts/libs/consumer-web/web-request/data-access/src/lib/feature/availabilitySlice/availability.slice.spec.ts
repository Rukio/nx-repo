import {
  serviceAreasSlice,
  mockServiceAreaAvailabilityQuery,
} from '@*company-data-covered*/station/data-access';
import { setupTestStore } from '../../../testUtils';
import { selectAddressAvailability } from './availability.slice';

describe('availability.slice', () => {
  describe('domain feature selectors', () => {
    it('should select correct address availability if response is truthy', async () => {
      fetchMock.mockResponse(JSON.stringify(true));
      const store = setupTestStore();

      await store.dispatch(
        serviceAreasSlice.endpoints.getServiceAreaAvailability.initiate(
          mockServiceAreaAvailabilityQuery
        )
      );

      const data = selectAddressAvailability(mockServiceAreaAvailabilityQuery)(
        store.getState()
      );
      expect(data).toEqual({
        isAddressAvailabilityClosed: false,
        isAddressAvailabilityError: false,
        isAddressAvailabilityOpen: true,
      });
    });

    it('should select correct address availability if response is falsy', async () => {
      fetchMock.mockResponse(JSON.stringify(false));
      const store = setupTestStore();

      await store.dispatch(
        serviceAreasSlice.endpoints.getServiceAreaAvailability.initiate(
          mockServiceAreaAvailabilityQuery
        )
      );

      const data = selectAddressAvailability(mockServiceAreaAvailabilityQuery)(
        store.getState()
      );
      expect(data).toEqual({
        isAddressAvailabilityClosed: true,
        isAddressAvailabilityError: false,
        isAddressAvailabilityOpen: false,
      });
    });

    it('should select correct address availability if response is unsuccessful', async () => {
      fetchMock.mockReject(new Error('Failed'));
      const store = setupTestStore();

      await store.dispatch(
        serviceAreasSlice.endpoints.getServiceAreaAvailability.initiate(
          mockServiceAreaAvailabilityQuery
        )
      );

      const data = selectAddressAvailability(mockServiceAreaAvailabilityQuery)(
        store.getState()
      );
      expect(data).toEqual({
        isAddressAvailabilityClosed: false,
        isAddressAvailabilityError: true,
        isAddressAvailabilityOpen: false,
      });
    });
  });
});
