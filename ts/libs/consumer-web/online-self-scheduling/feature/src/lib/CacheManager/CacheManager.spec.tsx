import {
  mockPreLoginChannelItemId,
  mockPreLoginPreferredEtaRange,
  mockPreLoginRequester,
  PRE_LOGIN_SLICE_KEY,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { render, screen, waitFor } from '../../testUtils';
import { CacheManager } from './CacheManager';
import { CACHE_MANAGER_TEST_IDS } from './testIds';

const mockChildTestId = 'mock-child';

const MockChild = () => <div data-testid={mockChildTestId}>test</div>;

const setupWithPredefinedPreLoginState = () => {
  return render(
    <CacheManager>
      <MockChild />
    </CacheManager>,
    {
      preloadedState: {
        [PRE_LOGIN_SLICE_KEY]: {
          requester: mockPreLoginRequester,
          preferredEtaRange: mockPreLoginPreferredEtaRange,
          channelItemId: mockPreLoginChannelItemId,
        },
      },
    }
  );
};

const setup = () => {
  return render(
    <CacheManager>
      <MockChild />
    </CacheManager>
  );
};

describe('<CacheManager />', () => {
  it('should render children after pre login data is saved', async () => {
    setup();

    const loader = screen.getByTestId(CACHE_MANAGER_TEST_IDS.LOADER);
    expect(loader).toBeVisible();

    await waitFor(() => {
      expect(loader).not.toBeVisible();
    });

    const child = await screen.findByTestId(mockChildTestId);
    expect(child).toBeVisible();
  });

  it('should render children without loader', async () => {
    setupWithPredefinedPreLoginState();

    const child = await screen.findByTestId(mockChildTestId);
    expect(child).toBeVisible();
  });
});
