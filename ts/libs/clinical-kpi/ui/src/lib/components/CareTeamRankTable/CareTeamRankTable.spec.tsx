import { render, screen } from '../../../testUtils';
import { Metrics } from '../../constants/index';

import { CareTeamRankTable, CareTeamRankTableProps } from './CareTeamRankTable';
import { careTeamRankingsMock } from './mocks';
import {
  CARE_TEAM_RANK_TABLE_TEST_IDS,
  CARE_TEAM_PLACEHOLDER_ROW_RANKS,
} from './TestIds';

const onRowClick = jest.fn();

const props: CareTeamRankTableProps = {
  type: Metrics.OnSceneTime,
  rows: careTeamRankingsMock,
  isLoading: false,
  onRowClick,
};

describe('CareTeamRankTable', () => {
  it('should render correctly', () => {
    render(<CareTeamRankTable {...props} type={Metrics.OnSceneTime} />);
    props.rows.forEach((rankTable) => {
      expect(
        screen.getByTestId(
          CARE_TEAM_RANK_TABLE_TEST_IDS.getRankTestId(rankTable.rank)
        )
      ).toBeVisible();
      expect(
        screen.getByTestId(
          CARE_TEAM_RANK_TABLE_TEST_IDS.getProviderNameTestId(rankTable.rank)
        )
      ).toBeVisible();
      expect(
        screen.getByTestId(
          CARE_TEAM_RANK_TABLE_TEST_IDS.getValueTestId(rankTable.rank)
        )
      ).toBeVisible();
      expect(
        screen.getByTestId(
          CARE_TEAM_RANK_TABLE_TEST_IDS.getValueChangeTestId(rankTable.rank)
        )
      ).toBeVisible();
    });
  });

  it('should call onClickRow', async () => {
    const testRank = 3;
    const { user } = render(
      <CareTeamRankTable
        {...props}
        type={Metrics.OnSceneTime}
        onRowClick={onRowClick}
      />
    );

    const provider = await screen.findByTestId(
      CARE_TEAM_RANK_TABLE_TEST_IDS.getValueTestId(testRank)
    );

    await user.click(provider);

    expect(onRowClick).toBeCalled();
  });

  it('should render placeholders', () => {
    render(<CareTeamRankTable {...props} rows={[]} isLoading />);

    CARE_TEAM_PLACEHOLDER_ROW_RANKS.map((rank) =>
      expect(
        screen.getByTestId(
          CARE_TEAM_RANK_TABLE_TEST_IDS.getPlaceholderTestId(rank)
        )
      ).toBeTruthy()
    );
  });

  describe('should render correctly when value 0 or undefined', () => {
    const testCases = [
      {
        description: 'should render when value field is undefined',
        value: undefined,
        expectedValue: 'No data',
      },
      {
        description: 'should render when value field is 0',
        value: 0,
        expectedValue: '0',
      },
    ];

    testCases.forEach(({ description, value, expectedValue }) => {
      it(`${description}`, async () => {
        const providerId = 1;
        render(
          <CareTeamRankTable
            {...props}
            rows={[{ ...careTeamRankingsMock[0], value }]}
          />
        );
        expect(
          await screen.findByTestId(
            CARE_TEAM_RANK_TABLE_TEST_IDS.getValueTestId(providerId)
          )
        ).toHaveTextContent(expectedValue);
      });
    });
  });
});
