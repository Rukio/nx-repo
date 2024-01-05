import { ReactNode } from 'react';
import { renderHook } from '@*company-data-covered*/shared/testing/react';
import { useSegment } from './useSegment';
import { SegmentProvider } from '../SegmentProvider/SegmentProvider';
import { it } from 'vitest';

vi.mock('@segment/analytics-next', async () => {
  const actual = await vi.importActual<
    typeof import('@segment/analytics-next')
  >('@segment/analytics-next');

  return {
    ...actual,
    AnalyticsBrowser: vi.fn().mockImplementation(() => ({
      ...actual.AnalyticsBrowser,
      load: vi.fn().mockResolvedValue({}),
    })),
  };
});

describe('useSegment', () => {
  it('should return segment instance', () => {
    const { result } = renderHook(() => useSegment(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <SegmentProvider loadOptions={{ writeKey: 'test-key' }}>
          {children}
        </SegmentProvider>
      ),
    });

    expect(result).toBeTruthy();
  });

  it('should throw an error if useSegment was used outside of <SegmentProvider />', async () => {
    expect(() => renderHook(() => useSegment())).toThrowError(
      /useSegment can be used only in components wrapped with <SegmentProvider \/>/
    );
  });
});
