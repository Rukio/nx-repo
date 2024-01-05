import {
  initializeGoogleRecaptcha,
  GoogleRecaptchaOptions,
  GOOGLE_RECAPTCHA_API_URL,
} from './init';

const mockGoogleRecaptchaOptions: GoogleRecaptchaOptions = {
  key: 'test',
};

describe('google recaptcha utils', () => {
  describe('initializeGoogleRecaptcha', () => {
    it('should call appendChild with correct options', () => {
      const spyOnDocumentHeadAppendChild = jest.spyOn(
        document.head,
        'appendChild'
      );
      initializeGoogleRecaptcha(mockGoogleRecaptchaOptions);

      expect(spyOnDocumentHeadAppendChild).toBeCalledWith(
        expect.objectContaining({
          src: `${GOOGLE_RECAPTCHA_API_URL}?render=${mockGoogleRecaptchaOptions.key}`,
        })
      );
    });
  });
});
