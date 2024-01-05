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
import PatientNPS from './PatientNPS';

describe('<PatientNPS />', () => {
  it('should call buildProvidersRanking with correct parameters', () => {
    const spyBuildProvidersRanking = jest.spyOn(util, 'buildProvidersRanking');
    render(
      <PatientNPS
        metrics={mockedProviderMetricsResponse}
        authenticatedUserId={mockAuthenticatedUserId}
        isLoading={false}
      />
    );

    expect(spyBuildProvidersRanking).toHaveBeenCalledWith({
      metrics: mockedProviderMetricsResponse,
      key: MetricsKeys.NPS,
      changeKey: MetricsChangeKeys.NPS,
      sortOrder: SortOrder.DESC,
      authenticatedUserId: mockAuthenticatedUserId,
      type: Metrics.NPS,
    });

    expect(screen.getByTestId(TEST_IDS.RANK_TABLE.TABLE)).toBeVisible();
  });
});
