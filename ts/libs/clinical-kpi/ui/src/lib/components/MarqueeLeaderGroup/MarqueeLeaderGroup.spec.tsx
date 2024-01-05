import { render, screen } from '../../../testUtils';
import { Metrics } from '../../constants';
import MarqueeLeaderGroup, {
  MarqueeLeaderGroupProps,
  Leader,
} from './MarqueeLeaderGroup';
import { MARQUEE_LEADER_GROUP_TEST_IDS } from './TestIds';
import { MARQUEE_LEADER_TEST_IDS } from '../MarqueeLeader/TestIds';

const rankMock = 1;

const getMockLeaders = (count: number): Leader[] =>
  Array.from({ length: count }).map((_, index) => ({
    position: 'APP',
    name: `Leader ${index}`,
    value: 320,
    valueChange: -100,
    avatarUrl:
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjLE9Ylr4f4BXaJfXkLC0YGydJDZVQoxK0Dg&usqp=CAU',
  }));

const props: MarqueeLeaderGroupProps = {
  rank: rankMock,
  type: Metrics.OnSceneTime,
  leaders: [],
};

describe('<MarqueeLeaderGroup />', () => {
  it('should render correctly when leaders count is 1', () => {
    const leaders = getMockLeaders(1);

    render(<MarqueeLeaderGroup {...props} leaders={leaders} />);

    expect(
      screen.getByTestId(MARQUEE_LEADER_TEST_IDS.getBadgeTestId(rankMock))
    ).toHaveTextContent(rankMock.toString());

    expect(
      screen.queryByTestId(
        MARQUEE_LEADER_GROUP_TEST_IDS.getContainerTestId(rankMock)
      )
    ).not.toBeInTheDocument();
  });

  it('should render correctly when leaders count is 2', () => {
    const leaders = getMockLeaders(2);

    render(<MarqueeLeaderGroup {...props} leaders={leaders} />);

    expect(
      screen.getByTestId(
        MARQUEE_LEADER_GROUP_TEST_IDS.getContainerTestId(rankMock)
      )
    ).toBeVisible();

    leaders.forEach((_leader, index) => {
      expect(
        screen.getByTestId(
          MARQUEE_LEADER_GROUP_TEST_IDS.getAvatarTestId(index, rankMock)
        )
      ).toBeVisible();
    });

    expect(
      screen.queryByTestId(
        MARQUEE_LEADER_GROUP_TEST_IDS.getAvatarPlaceholderTestId(rankMock)
      )
    ).not.toBeInTheDocument();
  });

  it('should render correctly when leaders count is 4', () => {
    const leaders = getMockLeaders(4);

    render(<MarqueeLeaderGroup {...props} leaders={leaders} />);

    expect(
      screen.getByTestId(
        MARQUEE_LEADER_GROUP_TEST_IDS.getContainerTestId(rankMock)
      )
    ).toBeVisible();

    // -1 because max count of showing  avatar is 3, and the last one should be placeholder
    leaders.splice(-1).forEach((_leader, index) => {
      expect(
        screen.getByTestId(
          MARQUEE_LEADER_GROUP_TEST_IDS.getAvatarTestId(index, rankMock)
        )
      ).toBeVisible();
    });

    expect(
      screen.getByTestId(
        MARQUEE_LEADER_GROUP_TEST_IDS.getAvatarPlaceholderTestId(rankMock)
      )
    ).toBeVisible();
  });

  it('should switch between slides', async () => {
    const leaders = getMockLeaders(4);

    const { user } = render(
      <MarqueeLeaderGroup {...props} leaders={leaders} />
    );

    await user.click(
      screen.getByTestId(
        MARQUEE_LEADER_GROUP_TEST_IDS.getNextButtonTestId(rankMock)
      )
    );

    expect(
      screen.queryByTestId(
        MARQUEE_LEADER_GROUP_TEST_IDS.getContainerTestId(rankMock)
      )
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByTestId(
        MARQUEE_LEADER_GROUP_TEST_IDS.getPreviousButtonTestId(rankMock)
      )
    );

    expect(
      screen.queryByTestId(
        MARQUEE_LEADER_GROUP_TEST_IDS.getContainerTestId(rankMock)
      )
    ).toBeVisible();
  });
});
