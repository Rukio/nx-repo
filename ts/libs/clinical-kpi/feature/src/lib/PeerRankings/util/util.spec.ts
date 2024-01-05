import { Metrics } from '@*company-data-covered*/clinical-kpi/ui';
import {
  buildProvidersRanking,
  getDefaultSelectedMarket,
  isValidProviderPosition,
} from './util';
import {
  MetricsKeys,
  MetricsChangeKeys,
  ProviderPosition,
} from '../../constants';
import {
  mockAuthenticatedUserId,
  mockedEmptyResponse,
  mockedProviderMetricsResponse,
  mockedProviderMetricsResponseWithNulls,
  mockedUserWithOneMarket,
  rebuiltProviderMetricsResponseTestData,
} from '../testUtils/mocks';
import { SortOrder } from '../types';

describe('buildProvidersRanking', () => {
  it('should return empty arrays', () => {
    const providersData = buildProvidersRanking({
      metrics: undefined,
      key: MetricsKeys.OnSceneTime,
      changeKey: MetricsChangeKeys.OnSceneTime,
      sortOrder: SortOrder.ASC,
      type: Metrics.OnSceneTime,
      authenticatedUserId: mockAuthenticatedUserId,
    });
    expect(providersData.marqueeLeaderProviders).toEqual({
      firstPosition: [],
      secondPosition: [],
      thirdPosition: [],
    });
    expect(providersData.rankTableProviders).toEqual([]);
  });

  it('should return empty arrays with empty data', () => {
    const providersData = buildProvidersRanking({
      metrics: mockedEmptyResponse,
      key: MetricsKeys.OnSceneTime,
      changeKey: MetricsChangeKeys.OnSceneTime,
      sortOrder: SortOrder.ASC,
      type: Metrics.OnSceneTime,
      authenticatedUserId: mockAuthenticatedUserId,
    });
    expect(providersData.marqueeLeaderProviders).toEqual({
      firstPosition: [],
      secondPosition: [],
      thirdPosition: [],
    });
    expect(providersData.rankTableProviders).toEqual([]);
  });

  it('should return correct data with ascending', () => {
    const providersData = buildProvidersRanking({
      metrics: mockedProviderMetricsResponse,
      key: MetricsKeys.OnSceneTime,
      changeKey: MetricsChangeKeys.OnSceneTime,
      sortOrder: SortOrder.ASC,
      type: Metrics.OnSceneTime,
      authenticatedUserId: mockAuthenticatedUserId,
    });

    expect(providersData).toEqual(rebuiltProviderMetricsResponseTestData);

    const { rankTableProviders } = providersData;

    expect(rankTableProviders[0].value).toBeLessThan(
      rankTableProviders[1].value
    );
  });

  it('should return correct data with descending', () => {
    const providersData = buildProvidersRanking({
      metrics: mockedProviderMetricsResponse,
      key: MetricsKeys.OnSceneTime,
      changeKey: MetricsChangeKeys.OnSceneTime,
      sortOrder: SortOrder.DESC,
      type: Metrics.OnSceneTime,
      authenticatedUserId: mockAuthenticatedUserId,
    });

    const { rankTableProviders } = providersData;

    expect(rankTableProviders[0].value).toBeGreaterThan(
      rankTableProviders[1].value
    );
  });

  it('should filter data by null', () => {
    const providersData = buildProvidersRanking({
      metrics: mockedProviderMetricsResponseWithNulls,
      key: MetricsKeys.OnSceneTime,
      changeKey: MetricsChangeKeys.OnSceneTime,
      sortOrder: SortOrder.DESC,
      type: Metrics.OnSceneTime,
      authenticatedUserId: mockAuthenticatedUserId,
    });

    const { rankTableProviders } = providersData;

    expect(rankTableProviders).toHaveLength(2);
  });

  it('should filter data by DHMT', () => {
    const mockData = mockedProviderMetricsResponse;
    const mockPositionFilter = ProviderPosition.DHMT;
    const providersData = buildProvidersRanking({
      metrics: mockData,
      key: MetricsKeys.OnSceneTime,
      changeKey: MetricsChangeKeys.OnSceneTime,
      sortOrder: SortOrder.DESC,
      type: Metrics.OnSceneTime,
      authenticatedUserId: mockAuthenticatedUserId,
      includedProviderPositions: [mockPositionFilter],
    });

    const { rankTableProviders, marqueeLeaderProviders } = providersData;

    expect(marqueeLeaderProviders.firstPosition).toHaveLength(1);
    expect(marqueeLeaderProviders.secondPosition).toHaveLength(1);
    expect(marqueeLeaderProviders.thirdPosition).toHaveLength(1);
    expect(rankTableProviders).toHaveLength(1);
  });

  it('should filter data by APP', () => {
    const mockData = mockedProviderMetricsResponse;
    const mockPositionFilter = ProviderPosition.APP;

    const providersData = buildProvidersRanking({
      metrics: mockData,
      key: MetricsKeys.OnSceneTime,
      changeKey: MetricsChangeKeys.OnSceneTime,
      type: Metrics.OnSceneTime,
      sortOrder: SortOrder.DESC,
      authenticatedUserId: mockAuthenticatedUserId,
      includedProviderPositions: [mockPositionFilter],
    });

    const { rankTableProviders, marqueeLeaderProviders } = providersData;

    expect(marqueeLeaderProviders.firstPosition).toHaveLength(1);
    expect(marqueeLeaderProviders.secondPosition).toHaveLength(1);
    expect(marqueeLeaderProviders.thirdPosition).toHaveLength(1);

    expect(rankTableProviders).toHaveLength(2);
  });
});

describe('isValidProviderPosition', () => {
  it.each([
    {
      name: 'APP',
      input: ProviderPosition.APP,
      expected: true,
    },
    {
      name: 'DHMT',
      input: ProviderPosition.DHMT,
      expected: true,
    },
    {
      name: 'invalid',
      input: 'invalid',
      expected: false,
    },
  ])('position is $name', ({ input, expected }) => {
    expect(isValidProviderPosition(input)).toStrictEqual(expected);
  });
});

describe('getDefaultSelectedMarket', () => {
  it('should return first item when market as default', () => {
    const defaultMarketId = getDefaultSelectedMarket(
      mockedUserWithOneMarket.markets
    );
    expect(defaultMarketId).toEqual(mockedUserWithOneMarket.markets[0].id);
  });
});
