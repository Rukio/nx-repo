import { parseAddress } from './googleAddressParser';

const mockGoogleAddress = {
  address_components: [
    {
      long_name: '430',
      short_name: '430',
      types: ['street_number'],
    },
    {
      long_name: 'South Colorado Boulevard',
      short_name: 'S Colorado Blvd',
      types: ['route'],
    },
    {
      long_name: 'Denver',
      short_name: 'Denver',
      types: ['locality', 'political'],
    },
    {
      long_name: 'Arapahoe County',
      short_name: 'Arapahoe County',
      types: ['administrative_area_level_2', 'political'],
    },
    {
      long_name: 'Colorado',
      short_name: 'CO',
      types: ['administrative_area_level_1', 'political'],
    },
    {
      long_name: 'United States',
      short_name: 'US',
      types: ['country', 'political'],
    },
    {
      long_name: 'West Chester Township',
      short_name: 'West Chester Township',
      types: ['administrative_area_level_3', 'political'],
    },
    {
      long_name: '80246',
      short_name: '80246',
      types: ['postal_code'],
    },
  ],
};

describe('googleAddressParser', () => {
  describe('parseAddress', () => {
    it('should return the parsed address', () => {
      const expectAddress = {
        streetNumber: '430',
        streetName: 'South Colorado Boulevard',
        city: 'Denver',
        addressLine2: 'Arapahoe County',
        state: 'CO',
        country: 'United States',
        township: 'West Chester Township',
        postalCode: '80246',
      };
      const actualAddress = parseAddress(mockGoogleAddress);

      expect(actualAddress).toStrictEqual(expectAddress);
    });

    it('should throw the error: Address Components is not an array', () => {
      expect(() => parseAddress({})).toThrowError(
        'Address Components is not an array'
      );
    });

    it('should throw the error: Address Components is empty', () => {
      expect(() =>
        parseAddress({
          address_components: [],
        })
      ).toThrowError('Address Components is empty');
    });
  });
});
