import { render, screen } from '@testing-library/react';
import { Metrics } from '../../constants';
import MarqueeLeader, { MarqueeLeaderProps } from './MarqueeLeader';
import { MARQUEE_LEADER_TEST_IDS } from './TestIds';

const props: MarqueeLeaderProps = {
  rank: 1,
  type: Metrics.OnSceneTime,
  position: 'APP',
  name: 'Desirae Bator',
  value: 5.34,
  valueChange: -1.67,
  avatarUrl:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjLE9Ylr4f4BXaJfXkLC0YGydJDZVQoxK0Dg&usqp=CAU',
};

describe('MarqueeLeader', () => {
  describe('OnSceneTime Type', () => {
    it('should render correctly with rank 1 with ascending order', () => {
      const rankMock = 1;
      const { asFragment } = render(
        <MarqueeLeader {...props} rank={rankMock} type={Metrics.OnSceneTime} />
      );
      expect(asFragment()).toMatchSnapshot();
      expect(
        screen.getByTestId(
          MARQUEE_LEADER_TEST_IDS.getValueChangeTestId(rankMock)
        )
      ).toHaveTextContent(`${props.valueChange} min`);
    });

    it('should render correctly with rank 3 with ascending order', () => {
      const valueChangeMock = 5;
      const rankMock = 1;
      const { asFragment } = render(
        <MarqueeLeader
          {...props}
          rank={1}
          type={Metrics.OnSceneTime}
          valueChange={valueChangeMock}
        />
      );
      expect(asFragment()).toMatchSnapshot();
      expect(
        screen.getByTestId(
          MARQUEE_LEADER_TEST_IDS.getValueChangeTestId(rankMock)
        )
      ).toHaveTextContent(`+${valueChangeMock} mins`);
    });
  });

  it('should render correctly for different type', () => {
    const valueChangeMock = 5;
    const rankMock = 1;
    const { asFragment } = render(
      <MarqueeLeader
        {...props}
        rank={rankMock}
        type={Metrics.NPS}
        valueChange={valueChangeMock}
      />
    );
    expect(asFragment()).toMatchSnapshot();
    expect(
      screen.getByTestId(MARQUEE_LEADER_TEST_IDS.getValueChangeTestId(rankMock))
    ).toHaveTextContent(`${valueChangeMock}`);
  });

  it('should render correctly with provider position', () => {
    const valueChangeMock = 5;
    const rankMock = 1;
    const { asFragment } = render(
      <MarqueeLeader
        {...props}
        rank={rankMock}
        position="APP"
        type={Metrics.NPS}
        valueChange={valueChangeMock}
      />
    );
    expect(asFragment()).toMatchSnapshot();
    expect(
      screen.getByTestId(MARQUEE_LEADER_TEST_IDS.getNameTestId(rankMock))
    ).toHaveTextContent(`${props.name} •`);
    expect(
      screen.getByTestId(MARQUEE_LEADER_TEST_IDS.getPositionTestId(rankMock))
    ).toHaveTextContent('APP');
  });

  it('should render correctly when rank is more than 3', () => {
    const valueChangeMock = 5;
    const rankMock = 4;
    const { asFragment } = render(
      <MarqueeLeader
        {...props}
        rank={rankMock}
        position="APP"
        type={Metrics.NPS}
        valueChange={valueChangeMock}
      />
    );
    expect(asFragment()).toMatchSnapshot();
    expect(
      screen.getByTestId(MARQUEE_LEADER_TEST_IDS.getBadgeTestId(rankMock))
    ).toHaveTextContent(`#${rankMock}`);
  });
});
