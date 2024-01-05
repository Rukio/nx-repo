import { GoogleTagManagerOptions } from './snippets';
import { initializeGoogleTagManager } from './init';

const mockGoogleTagManagerOptions: GoogleTagManagerOptions = {
  id: 'GTM-XXXXXXX',
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

describe('google tag manager utils', () => {
  describe('initializeGoogleTagManager', () => {
    it('should add dataLayer instance to window', () => {
      const spyOnDocumentHeadInsertBefore = jest.spyOn(
        document.head,
        'insertBefore'
      );
      const spyOnDocumentBodyInsertBefore = jest.spyOn(
        document.body,
        'insertBefore'
      );

      initializeGoogleTagManager(mockGoogleTagManagerOptions);

      expect(spyOnDocumentHeadInsertBefore).toBeCalled();
      expect(spyOnDocumentBodyInsertBefore).toBeCalled();
      expect(window.dataLayer).toBeDefined();
    });
  });
});
