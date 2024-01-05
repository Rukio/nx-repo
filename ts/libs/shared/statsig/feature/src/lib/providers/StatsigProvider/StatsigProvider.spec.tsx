import { render, screen, waitFor } from '@testing-library/react';
import { StatsigProvider } from './StatsigProvider';
import statsig from 'statsig-js';

vi.mock('statsig-js', async () => {
  const actual = await vi.importActual<typeof import('statsig-js')>(
    'statsig-js'
  );

  return {
    ...actual,
    default: {
      ...actual.default,
      initialize: vi.fn().mockResolvedValue({}),
      shutdown: vi.fn(),
    },
  };
});

const mockStatsigInitialize = vi.mocked(statsig.initialize);
const mockStatsigShutdown = vi.mocked(statsig.shutdown);

export const mockContentProps = {
  dataTestId: 'mock-content-component',
  textContent: 'Content',
};

export const mockLoadingComponentProps = {
  dataTestId: 'mock-loading-component',
  textContent: '...Loading',
};

export const MockLoadingComponent = () => (
  <div data-testid={mockLoadingComponentProps.dataTestId}>
    {mockLoadingComponentProps.textContent}
  </div>
);

export const MockContentComponent = () => (
  <div data-testid={mockContentProps.dataTestId}>
    {mockContentProps.textContent}
  </div>
);

describe('StatsigProvider', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should wait for init and render loading component correctly and render component after init', async () => {
    const { asFragment } = render(
      <StatsigProvider
        clientKey="client-XXX"
        loadingComponent={<MockLoadingComponent />}
      >
        <MockContentComponent />
      </StatsigProvider>
    );

    expect(asFragment()).toMatchSnapshot();

    const loadingComponent = screen.getByTestId(
      mockLoadingComponentProps.dataTestId
    );
    expect(loadingComponent.textContent).toContain(
      mockLoadingComponentProps.textContent
    );

    const contentComponent = await screen.findByTestId(
      mockContentProps.dataTestId
    );

    expect(contentComponent.textContent).toContain(
      mockContentProps.textContent
    );
  });

  it('should render content after statsig init failure', async () => {
    mockStatsigInitialize.mockRejectedValue(new Error());
    render(
      <StatsigProvider
        clientKey="client-XXX"
        loadingComponent={<MockLoadingComponent />}
      >
        <MockContentComponent />
      </StatsigProvider>
    );

    const loadingComponent = screen.getByTestId(
      mockLoadingComponentProps.dataTestId
    );
    expect(loadingComponent.textContent).toContain(
      mockLoadingComponentProps.textContent
    );

    const contentComponent = await screen.findByTestId(
      mockContentProps.dataTestId
    );
    expect(contentComponent.textContent).toContain('Content');
  });

  it('should render content after statsig init success', async () => {
    mockStatsigInitialize.mockResolvedValue();
    render(
      <StatsigProvider
        clientKey="client-XXX"
        loadingComponent={<MockLoadingComponent />}
      >
        <MockContentComponent />
      </StatsigProvider>
    );

    const loadingComponent = screen.getByTestId(
      mockLoadingComponentProps.dataTestId
    );
    expect(loadingComponent.textContent).toContain(
      mockLoadingComponentProps.textContent
    );

    const contentComponent = await screen.findByTestId(
      mockContentProps.dataTestId
    );
    expect(contentComponent.textContent).toContain('Content');
  });

  it('should render content immediately when waitForInitialization is falsy', () => {
    render(
      <StatsigProvider
        clientKey="client-XXX"
        loadingComponent={<MockLoadingComponent />}
        waitForInitialization={false}
      >
        <MockContentComponent />
      </StatsigProvider>
    );

    const loadingComponent = screen.queryByTestId(
      mockLoadingComponentProps.dataTestId
    );
    expect(loadingComponent).toBeNull();

    const contentComponent = screen.getByTestId(mockContentProps.dataTestId);
    expect(contentComponent.textContent).toContain('Content');
  });

  it('should call shutdown method on umount if shutdownOnUnmount prop is truthy', async () => {
    mockStatsigInitialize.mockResolvedValue();
    const { unmount } = render(
      <StatsigProvider
        clientKey="client-XXX"
        loadingComponent={<MockLoadingComponent />}
        shutdownOnUnmount
      >
        <MockContentComponent />
      </StatsigProvider>
    );

    const loadingComponent = screen.getByTestId(
      mockLoadingComponentProps.dataTestId
    );
    expect(loadingComponent.textContent).toContain(
      mockLoadingComponentProps.textContent
    );

    const contentComponent = await screen.findByTestId(
      mockContentProps.dataTestId
    );
    expect(contentComponent.textContent).toContain('Content');

    unmount();

    await waitFor(() => {
      expect(mockStatsigShutdown).toBeCalled();
    });
  });

  it('should not call shutdown method on umount if shutdownOnUnmount prop is falsy', async () => {
    mockStatsigInitialize.mockResolvedValue();
    const { unmount } = render(
      <StatsigProvider
        clientKey="client-XXX"
        loadingComponent={<MockLoadingComponent />}
        shutdownOnUnmount={false}
      >
        <MockContentComponent />
      </StatsigProvider>
    );

    const loadingComponent = screen.getByTestId(
      mockLoadingComponentProps.dataTestId
    );
    expect(loadingComponent.textContent).toContain(
      mockLoadingComponentProps.textContent
    );

    const contentComponent = await screen.findByTestId(
      mockContentProps.dataTestId
    );
    expect(contentComponent.textContent).toContain('Content');

    unmount();

    await waitFor(() => {
      expect(mockStatsigShutdown).not.toBeCalled();
    });
  });
});
