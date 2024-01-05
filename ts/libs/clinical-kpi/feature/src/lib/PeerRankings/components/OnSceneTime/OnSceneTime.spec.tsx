import { Metrics, TEST_IDS } from '@*company-data-covered*/clinical-kpi/ui';
import { screen } from '@testing-library/react';
import * as util from '../../util';
import { render } from '../../../util/testUtils';

import {
  mockedProviderMetricsResponse,
  mockAuthenticatedUserId,
} from '../../testUtils/mocks';
import { MetricsChangeKeys, MetricsKeys } from '../../../constants';
import { SortOrder } from '../../types';
import OnSceneTime from './OnSceneTime';

describe('<OnSceneTime />', () => {
  it('should call buildProvidersRanking with correct parameters', () => {
    const spyBuildProvidersRanking = jest.spyOn(util, 'buildProvidersRanking');
    render(
      <OnSceneTime
        metrics={mockedProviderMetricsResponse}
        authenticatedUserId={mockAuthenticatedUserId}
        isLoading={false}
      />
    );

    expect(spyBuildProvidersRanking).toHaveBeenCalledWith({
      metrics: mockedProviderMetricsResponse,
      key: MetricsKeys.OnSceneTime,
      changeKey: MetricsChangeKeys.OnSceneTime,
      sortOrder: SortOrder.ASC,
      authenticatedUserId: mockAuthenticatedUserId,
      type: Metrics.OnSceneTime,
    });

    expect(screen.getByTestId(TEST_IDS.RANK_TABLE.TABLE)).toBeVisible();
  });
});
