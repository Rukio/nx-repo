import { render, waitFor } from '../testUtils';
import {
  initDatadogRum,
  initDatadogLogs,
} from '@*company-data-covered*/shared/datadog/util';
import App from './app';
import { MemoryRouter } from 'react-router-dom';
import { mocked } from 'jest-mock';
import statsig from 'statsig-js';
import { environment } from '../environments/environment';
import { statsigOptions } from './constants';

jest.mock('@*company-data-covered*/shared/datadog/util', () => ({
  initDatadogRum: jest.fn(),
  initDatadogLogs: jest.fn(),
}));

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  checkGate: jest.fn(),
  initialize: jest.fn(),
  getExperiment: jest.fn().mockReturnValue({ get: jest.fn() }),
}));

const mockInitialize = mocked(statsig.initialize);

describe('App', () => {
  it('should initialize app successfully', async () => {
    mockInitialize.mockResolvedValue();

    const { baseElement, rerender } = render(<App />, { withRouter: true });
    expect(baseElement).toBeVisible();

    expect(initDatadogRum).toHaveBeenCalledTimes(1);
    expect(initDatadogLogs).toHaveBeenCalledTimes(1);

    rerender(
      <MemoryRouter>
        <App />
      </MemoryRouter>
    );

    expect(initDatadogRum).toHaveBeenCalledTimes(1);
    expect(initDatadogLogs).toHaveBeenCalledTimes(1);

    await waitFor(() => {
      expect(mockInitialize).toBeCalledWith(
        environment.statsigClientKey,
        {
          privateAttributes: {
            marketId: '',
            referrer: '',
          },
        },
        statsigOptions
      );
    });
  });

  it('should initialize app with correct statsig init options', async () => {
    mockInitialize.mockResolvedValue();

    const mockMarketSearchParam = 'test';

    const { baseElement } = render(<App />, {
      withRouter: true,
      routerProps: {
        initialEntries: [`/?market=${mockMarketSearchParam}`],
      },
    });
    expect(baseElement).toBeVisible();

    await waitFor(() => {
      expect(mockInitialize).toBeCalledWith(
        environment.statsigClientKey,
        {
          privateAttributes: {
            marketId: mockMarketSearchParam,
            referrer: '',
          },
        },
        statsigOptions
      );
    });
  });
});
