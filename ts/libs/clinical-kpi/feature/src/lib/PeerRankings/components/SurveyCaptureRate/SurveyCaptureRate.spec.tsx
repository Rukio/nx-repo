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
import SurveyCaptureRate from './SurveyCaptureRate';

describe('<SurveyCaptureRate />', () => {
  it('should call buildProvidersRanking with correct parameters', () => {
    const spyBuildProvidersRanking = jest.spyOn(util, 'buildProvidersRanking');
    render(
      <SurveyCaptureRate
        metrics={mockedProviderMetricsResponse}
        authenticatedUserId={mockAuthenticatedUserId}
        isLoading={false}
      />
    );

    expect(spyBuildProvidersRanking).toHaveBeenCalledWith({
      metrics: mockedProviderMetricsResponse,
      key: MetricsKeys.SurveyCapture,
      changeKey: MetricsChangeKeys.SurveyCapture,
      sortOrder: SortOrder.DESC,
      authenticatedUserId: mockAuthenticatedUserId,
      includedProviderPositions: [ProviderPosition.DHMT],
      type: Metrics.SurveyCapture,
    });

    expect(screen.getByTestId(TEST_IDS.RANK_TABLE.TABLE)).toBeVisible();
  });
});
