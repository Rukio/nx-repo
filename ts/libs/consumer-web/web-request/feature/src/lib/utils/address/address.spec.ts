import { getAddressInfo } from './address';
import { geocodeByAddress, geocodeByPlaceId } from 'react-places-autocomplete';
import { mocked } from 'jest-mock';

const mockLatLngLiteral: google.maps.LatLngLiteral = { lat: 1.2, lng: 5.6 };

jest.mock('react-places-autocomplete', () => ({
  geocodeByAddress: jest.fn().mockResolvedValue([
    {
      place_id: '1',
    },
  ]),
  geocodeByPlaceId: jest.fn().mockResolvedValue([
    {
      address_components: [
        {
          long_name: '12',
          short_name: '12',
          types: ['street_number'],
        },
        {
          long_name: 'Test St.',
          short_name: 'Test',
          types: ['route'],
        },
      ],
    },
  ]),
  getLatLng: () => Promise.resolve(mockLatLngLiteral),
}));

const mockGeocodeByAddress = mocked(geocodeByAddress);
const mockGeocodeByPlaceId = mocked(geocodeByPlaceId);

describe('address util', () => {
  describe('getAddressInfo', () => {
    it('should return parsed address', async () => {
      const mockAddress = '12 Test St. Test';
      const result = await getAddressInfo(mockAddress);

      expect(mockGeocodeByAddress).toBeCalledWith(mockAddress);
      expect(mockGeocodeByPlaceId).toBeCalledWith('1');

      expect(result).toStrictEqual({
        coordinates: mockLatLngLiteral,
        parsedAddress: {
          streetName: 'Test St.',
          streetNumber: '12',
        },
      });
    });
  });
});
