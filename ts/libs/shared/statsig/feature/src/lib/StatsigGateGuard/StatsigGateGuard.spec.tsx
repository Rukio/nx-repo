import { FC } from 'react';
import { render, screen } from '@testing-library/react';
import { StatsigGateGuard } from './StatsigGateGuard';
import statsig from 'statsig-js';

vi.mock('statsig-js');

const mockGateName = 'statsig_gate_guard_test_gate';
const childrenTestId = 'test-id-children';
const errorTestId = 'test-id-error';
const Child: FC = () => <p data-testid={childrenTestId}>Children</p>;
const ErrorComponent: FC = () => <p data-testid={errorTestId}>Error</p>;

const mockedCheckGate = vi.mocked(statsig.checkGate);

const setupMockGate = (mockEnabled: boolean) => {
  mockedCheckGate.mockImplementation((gateName: string) => {
    if (gateName === mockGateName) {
      return mockEnabled;
    }

    throw new Error('Unhandled mock situation');
  });
};

describe('StatsigGateGuard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Gate Enabled', () => {
    beforeEach(() => {
      setupMockGate(true);
    });

    it('should render children', async () => {
      render(
        <StatsigGateGuard
          gateName={mockGateName}
          errorComponent={<ErrorComponent />}
        >
          <Child />
        </StatsigGateGuard>
      );

      expect(screen.getByTestId(childrenTestId)).toBeVisible();
      expect(screen.queryByTestId(errorTestId)).not.toBeInTheDocument();
    });
  });

  describe('Gate Disabled', () => {
    beforeEach(() => {
      setupMockGate(false);
    });

    it('should render error', async () => {
      render(
        <StatsigGateGuard
          gateName={mockGateName}
          errorComponent={<ErrorComponent />}
        >
          <Child />
        </StatsigGateGuard>
      );

      expect(screen.getByTestId(errorTestId)).toBeVisible();
      expect(screen.queryByTestId(childrenTestId)).not.toBeInTheDocument();
    });
  });
});
