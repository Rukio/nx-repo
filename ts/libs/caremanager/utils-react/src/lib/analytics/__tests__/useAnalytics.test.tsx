import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AnalyticsProvider } from '../analyticsContext';
import { PreviousPageProvider } from '../previousPageContext';
import { TRACK_CREATE_EPISODE, useAnalytics } from '../useAnalytics';

const mockRoute = {
  from: '/previous-route',
};

const mockAnalytics = {
  page: vi.fn(() => Promise.resolve()),
  track: vi.fn(() => Promise.resolve()),
  identify: vi.fn(() => Promise.resolve()),
};

vi.mock('@segment/analytics-next', () => {
  class AnalyticsBrowserMock {
    static load() {
      return mockAnalytics;
    }
  }

  return {
    AnalyticsBrowser: AnalyticsBrowserMock,
  };
});

const setup = () => {
  return renderHook(() => useAnalytics(), {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[mockRoute.from]}>
        <AnalyticsProvider writeKey="abcd">
          <PreviousPageProvider>{children}</PreviousPageProvider>
        </AnalyticsProvider>
      </MemoryRouter>
    ),
  });
};

describe('useAnalytics', () => {
  it('tracks the viewed page correctly', () => {
    const { result } = setup();

    act(() => {
      result.current.trackPageViewed('PageName');
    });

    expect(mockAnalytics.page.mock.calls[0]).toEqual([
      {
        category: 'Care Manager Client',
        prevLocation: mockRoute.from,
      },
      'PageName',
    ]);
  });

  it('tracks an event correctly', () => {
    const { result } = setup();

    const eventProperties = {
      prop1: 'value1',
      prop2: 'value2',
    };

    act(() => {
      result.current.trackEvent(TRACK_CREATE_EPISODE, eventProperties);
    });

    expect(mockAnalytics.track).toHaveBeenCalledWith(
      TRACK_CREATE_EPISODE,
      eventProperties
    );
  });

  it('identifies a user correctly', () => {
    const { result } = setup();

    const userTraits = {
      trait1: 'value1',
      trait2: 'value2',
    };

    act(() => {
      result.current.identifyUser('UserID', userTraits);
    });

    expect(mockAnalytics.identify).toHaveBeenCalledWith(
      { id: 'UserID' },
      userTraits
    );
  });
});
