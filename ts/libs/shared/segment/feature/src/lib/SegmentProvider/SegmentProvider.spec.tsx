import { render, screen, waitFor } from '@*company-data-covered*/shared/testing/react';
import { SegmentProvider, SegmentProviderProps } from './SegmentProvider';

const mockSegmentLoad = vi.fn().mockResolvedValue({});

vi.mock('@segment/analytics-next', async () => {
  const actual = await vi.importActual<
    typeof import('@segment/analytics-next')
  >('@segment/analytics-next');

  return {
    ...actual,
    AnalyticsBrowser: vi.fn().mockImplementation(() => ({
      ...actual.AnalyticsBrowser,
      load: vi.fn((...args) => mockSegmentLoad(...args)),
    })),
  };
});

const mockComponentTestId = 'test-component';
const MockedComponent = () => (
  <div data-testid={mockComponentTestId}>component</div>
);

const mockLoaderTestId = 'test-loader';
const MockedLoaderComponent = () => (
  <div data-testid={mockLoaderTestId}>Loading...</div>
);

type MockSegmentProviderProps = Omit<SegmentProviderProps, 'children'>;
const mockSegmentProviderProps: MockSegmentProviderProps = {
  onInitFailure: vi.fn(),
  onInitSuccess: vi.fn(),
  loadOptions: {
    writeKey: 'test-key',
  },
  initOptions: {},
};

const setup = (overrideProps: Partial<MockSegmentProviderProps> = {}) => {
  return render(
    <SegmentProvider {...{ ...mockSegmentProviderProps, ...overrideProps }}>
      <MockedComponent />
    </SegmentProvider>
  );
};

describe('<SegmentProvider />', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should render child component and trigger initialized callback', async () => {
    setup();

    expect(screen.getByTestId(mockComponentTestId)).toBeVisible();

    await waitFor(() => {
      expect(mockSegmentLoad).toBeCalledWith(
        mockSegmentProviderProps.loadOptions,
        mockSegmentProviderProps.initOptions
      );
    });
    await waitFor(() => {
      expect(mockSegmentLoad).toBeCalledTimes(1);
    });
    await waitFor(() => {
      expect(mockSegmentProviderProps.onInitSuccess).toBeCalledTimes(1);
    });
  });

  it('should render child component and trigger callback if loading of SDK failed.', async () => {
    const testError = new Error('Failed.');
    mockSegmentLoad.mockRejectedValueOnce(testError);
    setup();

    expect(screen.getByTestId(mockComponentTestId)).toBeVisible();

    await waitFor(() => {
      expect(mockSegmentProviderProps.onInitFailure).toBeCalledTimes(1);
    });
    await waitFor(() => {
      expect(mockSegmentProviderProps.onInitFailure).toBeCalledWith(testError);
    });
  });

  it('should show loader component if waitForInitialization is truly', async () => {
    setup({
      waitForInitialization: true,
      loadingComponent: <MockedLoaderComponent />,
    });

    expect(screen.getByTestId(mockLoaderTestId)).toBeVisible();
    expect(await screen.findByTestId(mockComponentTestId)).toBeVisible();
    expect(screen.queryByTestId(mockLoaderTestId)).not.toBeInTheDocument();
  });
});
