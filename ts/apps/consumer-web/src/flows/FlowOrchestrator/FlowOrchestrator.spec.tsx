import { mocked } from 'jest-mock';
import { ReactElement } from 'react';
import statsig, { DynamicConfig, EvaluationReason } from 'statsig-js';
import { render, screen } from '../../testUtils';
import { CONSUMER_WEB_FLOWS_TEST_IDS } from '../testIds';
import { FlowOrchestrator } from './FlowOrchestrator';

jest.mock('statsig-js', () => ({
  ...jest.requireActual('statsig-js'),
  checkGate: jest.fn(),
  getExperiment: jest.fn(),
}));

jest.mock('@auth0/auth0-react', () => ({
  useAuth0: jest.fn().mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    loginWithRedirect: jest.fn(),
    getAccessTokenSilently: jest.fn().mockResolvedValue('test-token'),
  }),
  Auth0Provider: ({ children }: { children: ReactElement }) => children,
}));

const mockGetExperiment = mocked(statsig.getExperiment);

describe('<FlowOrchestrator />', () => {
  it('should show web request flow by default', async () => {
    const mockDynamicConfig = new DynamicConfig(
      'online_self_scheduling_flow',
      {
        renderOnlineSelfSchedulingFlow: false,
      },
      'ruleId',
      { time: 1, reason: EvaluationReason.Bootstrap }
    );
    mockGetExperiment.mockReturnValue(mockDynamicConfig);

    render(<FlowOrchestrator />, { withRouter: true });

    const webRequestFlow = await screen.findByTestId(
      CONSUMER_WEB_FLOWS_TEST_IDS.WEB_REQUEST_FLOW
    );
    expect(webRequestFlow).toBeVisible();

    const onlineSelfSchedulingFlow = screen.queryByTestId(
      CONSUMER_WEB_FLOWS_TEST_IDS.ONLINE_SELF_SCHEDULING_FLOW
    );
    expect(onlineSelfSchedulingFlow).not.toBeInTheDocument();
  });

  it('should show online self scheduling flow if renderOnlineSelfSchedulingFlow is truthy', async () => {
    const mockDynamicConfig = new DynamicConfig(
      'online_self_scheduling_flow',
      {
        renderOnlineSelfSchedulingFlow: true,
      },
      'ruleId',
      { time: 1, reason: EvaluationReason.Bootstrap }
    );
    mockGetExperiment.mockReturnValueOnce(mockDynamicConfig);

    render(<FlowOrchestrator />, { withRouter: true });

    const onlineSelfSchedulingFlow = await screen.findByTestId(
      CONSUMER_WEB_FLOWS_TEST_IDS.ONLINE_SELF_SCHEDULING_FLOW
    );
    expect(onlineSelfSchedulingFlow).toBeVisible();

    const webRequestFlow = screen.queryByTestId(
      CONSUMER_WEB_FLOWS_TEST_IDS.WEB_REQUEST_FLOW
    );
    expect(webRequestFlow).not.toBeInTheDocument();
  });
});
