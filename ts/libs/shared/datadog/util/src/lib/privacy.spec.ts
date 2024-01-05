import {
  DatadogPrivacyOption,
  getDataDogPrivacyHTMLAttributes,
} from './privacy';

describe('privacy', () => {
  describe('getDataDogPrivacyHTMLAttributes', () => {
    it.each([
      {
        option: DatadogPrivacyOption.Allow,
        expectedAttribute: { 'data-dd-privacy': DatadogPrivacyOption.Allow },
      },
      {
        option: DatadogPrivacyOption.Mask,
        expectedAttribute: { 'data-dd-privacy': DatadogPrivacyOption.Mask },
      },
      {
        option: DatadogPrivacyOption.Hidden,
        expectedAttribute: { 'data-dd-privacy': DatadogPrivacyOption.Hidden },
      },
      {
        option: DatadogPrivacyOption.MaskUserInput,
        expectedAttribute: {
          'data-dd-privacy': DatadogPrivacyOption.MaskUserInput,
        },
      },
      {
        option: undefined,
        expectedAttribute: {
          'data-dd-privacy': DatadogPrivacyOption.Mask,
        },
      },
    ])(
      'returns the correct data-dd-privacy attribute for $option option',
      ({ option, expectedAttribute }) => {
        const result = getDataDogPrivacyHTMLAttributes(option);
        expect(result).toEqual(expectedAttribute);
      }
    );
  });
});
