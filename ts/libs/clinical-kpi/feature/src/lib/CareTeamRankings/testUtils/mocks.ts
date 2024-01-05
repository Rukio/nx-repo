import {
  AuthenticatedUser,
  MarketMetrics,
  mockedAuthenticatedUser,
} from '@*company-data-covered*/clinical-kpi/data-access';
import {
  buildProvider,
  generateIncrementalMockedProviderMetrics,
} from '../../util/testUtils/builders/providerProfile';

export const mockedProviderMetricsResponse: MarketMetrics = {
  providerMetrics: [
    {
      provider: buildProvider(mockedAuthenticatedUser.id),
      metrics: generateIncrementalMockedProviderMetrics(19),
    },
  ],
};

export const mockAuthenticatedUserId: AuthenticatedUser['id'] =
  mockedProviderMetricsResponse.providerMetrics[0].provider.id.toString();
