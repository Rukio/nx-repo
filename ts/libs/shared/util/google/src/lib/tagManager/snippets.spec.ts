import {
  getGTMIframeScriptSnippet,
  getGTMScriptSnippet,
  GoogleTagManagerOptions,
} from './snippets';

const mockGoogleTagManagerOptions: GoogleTagManagerOptions = {
  id: 'GTM-XXXXXXX',
};

describe('snippets', () => {
  describe.each([
    {
      name: 'getGTMScriptSnippet',
      fn: getGTMScriptSnippet,
      expectedSubString: `(window,document,'script','dataLayer','${mockGoogleTagManagerOptions.id}')`,
    },
    {
      name: 'getGTMIframeScriptSnippet',
      fn: getGTMIframeScriptSnippet,
      expectedSubString: `https://www.googletagmanager.com/ns.html?id=${mockGoogleTagManagerOptions.id}`,
    },
  ])('$name', ({ fn, expectedSubString }) => {
    it('should return correct snippet with passed options', () => {
      const snippet = fn(mockGoogleTagManagerOptions);
      expect(snippet).toBeDefined();
      expect(snippet).toContain(expectedSubString);
    });
  });
});
