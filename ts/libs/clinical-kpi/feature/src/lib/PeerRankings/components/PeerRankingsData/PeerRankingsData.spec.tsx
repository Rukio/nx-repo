import { Metrics, TEST_IDS } from '@*company-data-covered*/clinical-kpi/ui';
import { screen } from '@testing-library/react';
import { buildProvidersRanking } from '../../util';
import { renderWithUserProvider } from '../../../util/testUtils';
import {
  mockedProviderMetricsResponse,
  mockAuthenticatedUserId,
} from '../../testUtils/mocks';
import { MetricsChangeKeys, MetricsKeys } from '../../../constants';
import { Provider, SortOrder } from '../../types';
import PeerRankingsData from '../PeerRankingsData';

describe('<PeerRankingsData />', () => {
  it('should render leaders and table correct', async () => {
    const builtProviderData = buildProvidersRanking({
      metrics: mockedProviderMetricsResponse,
      key: MetricsKeys.NPS,
      changeKey: MetricsChangeKeys.NPS,
      sortOrder: SortOrder.DESC,
      authenticatedUserId: mockAuthenticatedUserId,
      type: Metrics.OnSceneTime,
    });

    renderWithUserProvider(
      <PeerRankingsData
        marqueeLeaderProvidersData={builtProviderData?.marqueeLeaderProviders}
        currentProviderData={builtProviderData?.currentProviderData}
        rankingProvidersData={builtProviderData?.rankTableProviders}
        isLoading={false}
        type={Metrics.NPS}
      />
    );

    const rankTable = await screen.findByTestId(TEST_IDS.RANK_TABLE.TABLE);

    expect(rankTable).toBeVisible();

    const { marqueeLeaderProviders, currentProviderData, rankTableProviders } =
      builtProviderData;

    const { firstPosition, secondPosition, thirdPosition } =
      marqueeLeaderProviders;

    [
      currentProviderData as Provider, // we are sure that currentProviderData is defined in this case
      firstPosition[0],
      secondPosition[0],
      thirdPosition[0],
    ].forEach((provider) => {
      expect(
        screen.getByTestId(
          TEST_IDS.MARQUEE_LEADER.getBadgeTestId(provider?.rank)
        )
      ).toHaveTextContent(provider?.rank.toString());

      expect(
        screen.getByTestId(
          TEST_IDS.MARQUEE_LEADER.getNameTestId(provider?.rank)
        )
      ).toHaveTextContent(provider?.name);
    });

    //validate table headers
    expect(
      screen.getByTestId(TEST_IDS.RANK_TABLE.getRankTestId())
    ).toHaveTextContent('#');
    expect(
      screen.getByTestId(TEST_IDS.RANK_TABLE.getProviderNameTestId())
    ).toHaveTextContent('Name');
    expect(
      screen.getByTestId(TEST_IDS.RANK_TABLE.getValueTestId())
    ).toHaveTextContent(Metrics.NPS);
    expect(
      screen.getByTestId(TEST_IDS.RANK_TABLE.getValueChangeTestId())
    ).toHaveTextContent('Change');

    rankTableProviders.forEach((provider) => {
      expect(
        screen.getByTestId(TEST_IDS.RANK_TABLE.getRankTestId(provider.rank))
      ).toHaveTextContent(provider.rank.toString());
      expect(
        screen.getByTestId(
          TEST_IDS.RANK_TABLE.getProviderNameTestId(provider.rank)
        )
      ).toHaveTextContent(provider.name);
      expect(
        screen.getByTestId(TEST_IDS.RANK_TABLE.getValueTestId(provider.rank))
      ).toBeVisible();
      expect(
        screen.getByTestId(
          TEST_IDS.RANK_TABLE.getValueChangeTestId(provider.rank)
        )
      ).toBeVisible();
    });
  });
});
