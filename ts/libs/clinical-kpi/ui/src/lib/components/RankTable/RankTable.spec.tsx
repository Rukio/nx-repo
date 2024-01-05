import { render, screen } from '../../../testUtils';

import RankTable, { RankTableProps } from './RankTable';
import { buildStaticMockRows } from './mocks';
import { Metrics } from '../../constants';
import { PLACEHOLDER_ROW_RANKS, RANK_TABLE_TEST_IDS } from './TestIds';

const props: RankTableProps = {
  type: Metrics.OnSceneTime,
  rows: buildStaticMockRows(),
  startRank: 4,
  isLoading: false,
};

describe('RankTable', () => {
  describe('OnSceneTime Type', () => {
    it('should render correctly', () => {
      const { asFragment } = render(
        <RankTable {...props} type={Metrics.OnSceneTime} />
      );
      expect(asFragment()).toMatchSnapshot();
    });
  });

  it('should render correctly for different type', () => {
    const { asFragment } = render(
      <RankTable {...props} type={Metrics.ChartClosure} />
    );
    expect(asFragment()).toMatchSnapshot();
  });

  it('should render placeholders', () => {
    render(
      <RankTable
        startRank={4}
        rows={[]}
        isLoading={true}
        type={Metrics.ChartClosure}
      />
    );
    PLACEHOLDER_ROW_RANKS.map((rank) =>
      expect(
        screen.getByTestId(RANK_TABLE_TEST_IDS.getPlaceholderTestId(rank))
      ).toBeTruthy()
    );
  });

  it('should not drop when we click on a table item when onRowClick has not been passed', async () => {
    const onRowClick = jest.fn();
    const { user } = render(
      <RankTable {...props} type={Metrics.OnSceneTime} />
    );

    const provider = screen.getByTestId(
      RANK_TABLE_TEST_IDS.getPositionTestId(4)
    );

    await user.click(provider);

    expect(onRowClick).not.toHaveBeenCalled();
  });
});
