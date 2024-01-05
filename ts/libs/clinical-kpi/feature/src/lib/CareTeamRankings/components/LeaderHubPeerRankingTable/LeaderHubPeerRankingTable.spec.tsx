import {
  CareTeamRankTableRow,
  TEST_IDS,
} from '@*company-data-covered*/clinical-kpi/ui';
import { render, screen } from '../../../util/testUtils';
import {
  LeaderHubMetricsChangeKeys,
  LeaderHubMetricsKeys,
  LeaderHubMetricsRankKeys,
  LeaderHubRankingProps,
} from '../../../constants';
import {
  MARKET_PROVIDER_METRICS,
  Metrics as MarketMetrics,
  MOCK_PROVIDER_ID,
} from '@*company-data-covered*/clinical-kpi/data-access';
import LeaderHubPeerRankingTable from './LeaderHubPeerRankingTable';
import {
  buildProvidersLeaderHubRanking,
  BuildLeaderHubProvidersRankingParams,
} from '../../util';

const mockOnRowClick = jest.fn();
const handleSearch = jest.fn();

const defaultProps: LeaderHubRankingProps = {
  metrics: MARKET_PROVIDER_METRICS,
  isLoading: false,
  valueKey: LeaderHubMetricsKeys.OnSceneTime,
  changeKey: LeaderHubMetricsChangeKeys.OnSceneTime,
  type: MarketMetrics.OnSceneTime,
  rankKey: LeaderHubMetricsRankKeys.OnSceneTime,
  searchText: '',
  onRowClick: mockOnRowClick,
  handleSearch,
};

const setup = () => render(<LeaderHubPeerRankingTable {...defaultProps} />);

const buildProvidersLeaderHubRankingParams: BuildLeaderHubProvidersRankingParams =
  {
    metrics: MARKET_PROVIDER_METRICS,
    key: LeaderHubMetricsKeys.OnSceneTime,
    changeKey: LeaderHubMetricsChangeKeys.OnSceneTime,
    type: MarketMetrics.OnSceneTime,
    rankKey: LeaderHubMetricsRankKeys.OnSceneTime,
  };

const performRankTableChecks = (rankTableProviders: CareTeamRankTableRow[]) => {
  rankTableProviders.forEach((rankTable) => {
    expect(
      screen.getByTestId(
        TEST_IDS.CARE_TEAM_RANK_TABLE.getRankTestId(rankTable.id)
      )
    ).toBeVisible();

    expect(
      screen.getByTestId(
        TEST_IDS.CARE_TEAM_RANK_TABLE.getProviderNameTestId(rankTable.id)
      )
    ).toBeVisible();

    expect(
      screen.getByTestId(
        TEST_IDS.CARE_TEAM_RANK_TABLE.getValueTestId(rankTable.id)
      )
    ).toBeVisible();

    expect(
      screen.getByTestId(
        TEST_IDS.CARE_TEAM_RANK_TABLE.getValueChangeTestId(rankTable.id)
      )
    ).toBeVisible();
  });
};

describe('<LeaderHubPeerRankingTable />', () => {
  it('should call buildProvidersRanking with correct parameters', async () => {
    setup();

    const { rankTableProviders } = buildProvidersLeaderHubRanking(
      buildProvidersLeaderHubRankingParams
    );

    const careTeamRankTable = await screen.findByTestId(
      TEST_IDS.CARE_TEAM_RANK_TABLE.TABLE
    );

    expect(careTeamRankTable).toBeVisible();

    performRankTableChecks(rankTableProviders);
  });

  it('should call onClickRow', async () => {
    const providerId = MOCK_PROVIDER_ID;

    const { user } = setup();

    const provider = await screen.findByTestId(
      TEST_IDS.CARE_TEAM_RANK_TABLE.getValueTestId(providerId)
    );

    await user.click(provider);

    expect(mockOnRowClick).toBeCalled();
  });

  it('should call handleSearch when user types text into search field', async () => {
    const { user } = setup();

    const search = await screen.findByTestId(TEST_IDS.SEARCH_FIELD.ROOT);

    expect(search).toBeVisible();

    const searchFieldInput = await screen.findByTestId(
      TEST_IDS.SEARCH_FIELD.INPUT
    );
    expect(searchFieldInput).toBeVisible();
    await user.type(searchFieldInput, 'A');
    expect(handleSearch).toBeCalledWith('A');
  });
});
