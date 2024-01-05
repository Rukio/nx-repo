import { render, screen } from '../util/testUtils';
import { TEST_IDS } from '@*company-data-covered*/clinical-kpi/ui';
import { ClinicalKPIGateGuard } from './';
import { mocked } from 'jest-mock';
import { StatsigGateGuard } from '@*company-data-covered*/statsig/feature';
import { FC } from 'react';
import { CLINICAL_KPI_FEATURE_GATE_ERROR_TEXT } from './constants';
import { APP_BAR_TEST_IDS } from '../AppBar';

const childrenTestId = 'test-id-children';
const Child: FC = () => <p data-testid={childrenTestId}>Children</p>;

jest.mock('@*company-data-covered*/statsig/feature', () => ({
  StatsigGateGuard: jest.fn(),
}));

jest.mock('statsig-js', () => ({
  checkGate: jest.fn(),
}));

const mockedStatsigGateGuard = mocked(StatsigGateGuard);

describe('ClinicalKPIGateGuard', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('StatsigGateGuard renders children', () => {
    beforeEach(() => {
      mockedStatsigGateGuard.mockImplementation(({ children }) => (
        <>{children}</>
      ));
    });

    it('should render correctly', () => {
      render(
        <ClinicalKPIGateGuard stationURL="https://example.com">
          <Child />
        </ClinicalKPIGateGuard>
      );

      expect(screen.getByTestId(childrenTestId)).toBeVisible();
      expect(
        screen.queryByTestId(TEST_IDS.ALERT_BUTTON.TEXT)
      ).not.toBeInTheDocument();
    });
  });

  describe('StatsigGateGuard renders error', () => {
    beforeEach(() => {
      mockedStatsigGateGuard.mockImplementation(({ errorComponent }) => (
        <>{errorComponent}</>
      ));
    });

    it('should render correctly', () => {
      render(
        <ClinicalKPIGateGuard stationURL="https://example.com">
          <Child />
        </ClinicalKPIGateGuard>
      );

      expect(
        screen.getByTestId(APP_BAR_TEST_IDS.DISPATCH_HEALTH_LOGO_LINK)
      ).toBeVisible();
      expect(screen.getByTestId(TEST_IDS.ALERT_BUTTON.TEXT)).toHaveTextContent(
        CLINICAL_KPI_FEATURE_GATE_ERROR_TEXT
      );
      expect(screen.queryByTestId(childrenTestId)).not.toBeInTheDocument();
    });
  });
});
