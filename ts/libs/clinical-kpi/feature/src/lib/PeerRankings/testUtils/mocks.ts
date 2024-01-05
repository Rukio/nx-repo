import {
  AuthenticatedUser,
  MarketMetrics,
  mockedAuthenticatedUser,
  mockedProviderMetrics,
} from '@*company-data-covered*/clinical-kpi/data-access';
import { Metrics } from '@*company-data-covered*/clinical-kpi/ui';
import { buildProviderProfileDHMT, buildProviderProfileAPP } from './testUtil';
import {
  formatProviderPosition,
  getNumericMetricValue,
} from '../../util/metricUtils';
import { generateIncrementalMockedProviderMetrics } from '../../util/testUtils/builders/providerProfile';

export const mockedUserWithOneMarket = {
  ...mockedAuthenticatedUser,
  markets: [
    {
      id: '198',
      name: 'Columbus',
      shortName: 'COL',
    },
  ],
};

export const mockedUserWithoutMarkets = {
  ...mockedAuthenticatedUser,
  markets: [],
};

export const mockedEmptyResponse: MarketMetrics = {
  providerMetrics: [],
};

export const mockedProviderMetricsResponse: MarketMetrics = {
  providerMetrics: [
    {
      provider: {
        id: Number(mockedAuthenticatedUser.id),
        firstName: 'Jack',
        lastName: 'Samura',
        avatarUrl: 'avatar.jpg',
        profile: buildProviderProfileAPP(),
      },
      metrics: generateIncrementalMockedProviderMetrics(19),
    },
    {
      provider: {
        id: 2,
        firstName: 'Jack',
        lastName: 'Samura',
        avatarUrl: 'avatar.jpg',
        profile: buildProviderProfileDHMT(),
      },
      metrics: generateIncrementalMockedProviderMetrics(20),
    },
    {
      provider: {
        id: 3,
        firstName: 'Nick',
        lastName: 'Walker',
        avatarUrl: 'avatar2.jpg',
        profile: buildProviderProfileDHMT(),
      },
      metrics: generateIncrementalMockedProviderMetrics(21),
    },
    {
      provider: {
        id: 4,
        firstName: 'Bart',
        lastName: 'Simpson',
        avatarUrl: 'avatar3.jpg',
        profile: buildProviderProfileAPP(),
      },
      metrics: generateIncrementalMockedProviderMetrics(22),
    },
    {
      provider: {
        id: 5,
        firstName: 'Lisa',
        lastName: 'Laura',
        avatarUrl: 'avatar4.jpg',
        profile: buildProviderProfileAPP(),
      },
      metrics: generateIncrementalMockedProviderMetrics(23),
    },
    {
      provider: {
        id: 6,
        firstName: 'Jack',
        lastName: 'Reacher',
        avatarUrl: 'avatar5.jpg',
        profile: buildProviderProfileAPP(),
      },
      metrics: generateIncrementalMockedProviderMetrics(24),
    },
    {
      provider: {
        id: 7,
        firstName: '6_first',
        lastName: '6_last',
        avatarUrl: 'avatar.jpg',
        profile: buildProviderProfileDHMT(),
      },
      metrics: generateIncrementalMockedProviderMetrics(25),
    },
    {
      provider: {
        id: 8,
        firstName: '7_first',
        lastName: '7_last',
        avatarUrl: 'avatar2.jpg',
        profile: buildProviderProfileDHMT(),
      },
      metrics: generateIncrementalMockedProviderMetrics(26),
    },
    {
      provider: {
        id: 9,
        firstName: '8_first',
        lastName: '8_last',
        avatarUrl: 'avatar2.jpg',
        profile: buildProviderProfileAPP(),
      },
      metrics: generateIncrementalMockedProviderMetrics(27),
    },
  ],
};

export const mockedProviderMetricsResponseWithNulls: MarketMetrics = {
  providerMetrics: [
    {
      provider: {
        id: 1,
        firstName: 'Jack',
        lastName: 'Samura',
        avatarUrl: 'avatar.jpg',
        profile: buildProviderProfileDHMT(),
      },
      metrics: {
        ...mockedProviderMetrics,
        medianOnSceneTimeSecs: 1,
        medianOnSceneTimeSecsChange: 11,
      },
    },
    {
      provider: {
        id: 2,
        firstName: 'Nick',
        lastName: 'Walker',
        avatarUrl: 'avatar2.jpg',
        profile: buildProviderProfileDHMT(),
      },
      metrics: {
        ...mockedProviderMetrics,
        medianOnSceneTimeSecs: 2,
        medianOnSceneTimeSecsChange: 12,
      },
    },
    {
      provider: {
        id: 3,
        firstName: 'Bart',
        lastName: 'Simpson',
        avatarUrl: 'avatar3.jpg',
        profile: buildProviderProfileAPP(),
      },
      metrics: {
        ...mockedProviderMetrics,
        medianOnSceneTimeSecs: 3,
        medianOnSceneTimeSecsChange: 13,
      },
    },
    {
      provider: {
        id: 4,
        firstName: 'Lisa',
        lastName: 'Laura',
        avatarUrl: 'avatar4.jpg',
        profile: buildProviderProfileAPP(),
      },
      metrics: {
        ...mockedProviderMetrics,
        medianOnSceneTimeSecs: 4,
        medianOnSceneTimeSecsChange: 14,
      },
    },
    {
      provider: {
        id: 5,
        firstName: 'Jack',
        lastName: 'Reacher',
        avatarUrl: 'avatar5.jpg',
        profile: buildProviderProfileAPP(),
      },
      metrics: {
        ...mockedProviderMetrics,
        medianOnSceneTimeSecs: 5,
        medianOnSceneTimeSecsChange: 15,
      },
    },
    {
      provider: {
        id: 6,
        firstName: 'Luke',
        lastName: 'Skywalker',
        avatarUrl: 'avatar6.jpg',
        profile: buildProviderProfileAPP(),
      },
      metrics: {
        ...mockedProviderMetrics,
        medianOnSceneTimeSecs: null,
        medianOnSceneTimeSecsChange: null,
      },
    },
  ],
};

export const mockAuthenticatedUserId: AuthenticatedUser['id'] =
  mockedProviderMetricsResponse.providerMetrics[0].provider.id.toString();

const [firstPosition, secondPosition, thirdPosition] =
  mockedProviderMetricsResponse.providerMetrics
    .slice(0, 3)
    .map((data, index) => ({
      id: data.provider.id,
      name: `${data.provider.firstName} ${data.provider.lastName}`,
      value: getNumericMetricValue(
        data.metrics.medianOnSceneTimeSecs,
        Metrics.OnSceneTime
      ),
      valueChange: getNumericMetricValue(
        data.metrics.medianOnSceneTimeSecsChange,
        Metrics.OnSceneTime
      ),
      avatarUrl: data.provider.avatarUrl,
      rank: index + 1,
      position: formatProviderPosition(data.provider.profile.position),
    }));

export const rebuiltProviderMetricsResponseTestData = {
  currentProviderData: {
    avatarUrl: 'avatar.jpg',
    id: 1,
    name: 'Jack Samura',
    position: 'APP',
    rank: 1,
    value: 0.33,
    valueChange: 0.33,
  },
  marqueeLeaderProviders: {
    firstPosition: firstPosition ? [firstPosition] : [],
    secondPosition: secondPosition ? [secondPosition] : [],
    thirdPosition: thirdPosition ? [thirdPosition] : [],
  },
  rankTableProviders: mockedProviderMetricsResponse.providerMetrics
    .slice(3)
    .map((data, index) => ({
      id: data.provider.id,
      name:
        data.provider.id.toString() === mockAuthenticatedUserId
          ? `${data.provider.firstName} ${data.provider.lastName}`
          : '',
      value: getNumericMetricValue(
        data.metrics.medianOnSceneTimeSecs,
        Metrics.OnSceneTime
      ),
      valueChange: getNumericMetricValue(
        data.metrics.medianOnSceneTimeSecsChange,
        Metrics.OnSceneTime
      ),
      avatarUrl: data.provider.avatarUrl,
      rank: index + 4,
      position: formatProviderPosition(data.provider.profile.position),
    })),
};
