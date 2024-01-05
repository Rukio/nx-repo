import {
  initializeGoogleMaps,
  GoogleMapsOptions,
  GOOGLE_MAPS_API_URL,
} from './init';

const mockGoogleMapsOptions: Required<GoogleMapsOptions> = {
  key: 'test',
  libraries: ['places', 'geometry'],
  language: 'en',
};

describe('init utils', () => {
  describe('initializeGoogleMaps', () => {
    it.each([
      {
        name: 'should call appendChild with correct options',
        options: mockGoogleMapsOptions,
        expected: `${GOOGLE_MAPS_API_URL}?key=${mockGoogleMapsOptions.key}&libraries=${mockGoogleMapsOptions.libraries[0]}%2C${mockGoogleMapsOptions.libraries[1]}&language=${mockGoogleMapsOptions.language}`,
      },
      {
        name: 'should call appendChild only with required options',
        options: {
          ...mockGoogleMapsOptions,
          libraries: undefined,
          language: undefined,
        },
        expected: `${GOOGLE_MAPS_API_URL}?key=${mockGoogleMapsOptions.key}`,
      },
    ])('$name', () => {
      const spyOnDocumentHeadAppendChild = jest.spyOn(
        document.head,
        'appendChild'
      );
      initializeGoogleMaps(mockGoogleMapsOptions);

      expect(spyOnDocumentHeadAppendChild).toBeCalledWith(
        expect.objectContaining({
          src: `${GOOGLE_MAPS_API_URL}?key=${mockGoogleMapsOptions.key}&libraries=${mockGoogleMapsOptions.libraries[0]}%2C${mockGoogleMapsOptions.libraries[1]}&language=${mockGoogleMapsOptions.language}`,
        })
      );
    });
  });
});
