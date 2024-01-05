import { ReactElement } from 'react';
import { render, screen, waitFor } from '../testUtils';
import ModalityStatsigProvider from './ModalityStatsigProvider';
import { MODALITY_STATSIG_PROVIDER_TEST_IDS } from './testIds';

const mockedAuth0SuccessResult = {
  isLoading: false,
  isAuthenticated: true,
  user: { email: 'fake-email' },
};
const mockedAuth0LoadingResult = {
  isLoading: true,
};
const mockedAuth0ErrorResult = {
  isLoading: false,
  error: new Error('something went wrong'),
};

const mockedUseAuth0 = jest.fn().mockReturnValue(mockedAuth0SuccessResult);

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: () => mockedUseAuth0(),
  Auth0Provider: ({ children }: { children: ReactElement }) => children,
}));

jest.mock('statsig-js', () => ({
  initialize: jest.fn(
    // mock with timeout to check loading container visibility.
    async () => new Promise((resolve) => setTimeout(resolve, 500))
  ),
}));

const mockedClientKey = 'test-client-key';

const fakeBodyTestId = 'fake-body';
const FakeBodyComponent = () => (
  <div data-testid={fakeBodyTestId}>fake body</div>
);

const findFakeBody = () => screen.findByTestId(fakeBodyTestId);
const queryLoadingContainer = () =>
  screen.queryByTestId(
    new RegExp(MODALITY_STATSIG_PROVIDER_TEST_IDS.LOADING_CONTAINER_PREFIX)
  );

const setup = () =>
  render(
    <ModalityStatsigProvider clientKey={mockedClientKey}>
      <FakeBodyComponent />
    </ModalityStatsigProvider>
  );

describe('<ModalityStatsigProviderProps />', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render child content', async () => {
    setup();

    const initialLoadingElement = queryLoadingContainer();
    expect(initialLoadingElement).toBeVisible();

    const fakeBody = await findFakeBody();
    expect(fakeBody).toBeVisible();

    await waitFor(() => {
      const loadingElement = queryLoadingContainer();
      expect(loadingElement).not.toBeInTheDocument();
    });
  });

  it('should show loading container while waiting for auth0 response', () => {
    mockedUseAuth0.mockReturnValueOnce(mockedAuth0LoadingResult);
    setup();

    const loadingElement = queryLoadingContainer();
    expect(loadingElement).toBeVisible();
  });

  it('should show error message', () => {
    mockedUseAuth0.mockReturnValueOnce(mockedAuth0ErrorResult);
    setup();

    const errorMessage = screen.getByText(mockedAuth0ErrorResult.error.message);
    expect(errorMessage).toBeVisible();
  });
});
