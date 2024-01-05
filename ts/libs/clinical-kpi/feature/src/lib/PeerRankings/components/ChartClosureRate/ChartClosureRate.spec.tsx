import { Metrics, TEST_IDS } from '@*company-data-covered*/clinical-kpi/ui';
import { screen } from '@testing-library/react';
import * as util from '../../util';
import { render } from '../../../util/testUtils';
import {
  mockedProviderMetricsResponse,
  mockAuthenticatedUserId,
} from '../../testUtils/mocks';
import {
  MetricsChangeKeys,
  MetricsKeys,
  ProviderPosition,
} from '../../../constants';
import { SortOrder } from '../../types';
import ChartClosureRate from './ChartClosureRate';

describe('<ChartClosureRate />', () => {
  it('should call buildProvidersRanking with correct parameters', async () => {
    const spyBuildProvidersRanking = jest.spyOn(util, 'buildProvidersRanking');
    render(
      <ChartClosureRate
        metrics={mockedProviderMetricsResponse}
        authenticatedUserId={mockAuthenticatedUserId}
        isLoading={false}
      />
    );

    expect(spyBuildProvidersRanking).toHaveBeenCalledWith({
      metrics: mockedProviderMetricsResponse,
      key: MetricsKeys.ChartClosure,
      changeKey: MetricsChangeKeys.ChartClosure,
      sortOrder: SortOrder.DESC,
      authenticatedUserId: mockAuthenticatedUserId,
      includedProviderPositions: [ProviderPosition.APP],
      type: Metrics.ChartClosure,
    });

    expect(screen.getByTestId(TEST_IDS.RANK_TABLE.TABLE)).toBeVisible();
  });
});
