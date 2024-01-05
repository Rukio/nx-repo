import { render, screen } from '../../../testUtils/test-utils';
import { BasicMarketVisitsAverage } from '../__storybook__/MarketVisitsAverage.stories';
import MARKET_VISITS_AVERAGE_TEST_IDS from '../testIds';

describe('Snapshot tests', () => {
  test('should render', () => {
    const { asFragment } = render(<BasicMarketVisitsAverage />);
    expect(asFragment()).toMatchSnapshot();
  });
});

describe('Unit tests', () => {
  test('should render correct content', () => {
    render(<BasicMarketVisitsAverage />);
    expect(
      screen.getByTestId(
        MARKET_VISITS_AVERAGE_TEST_IDS.MARKET_VISITS_AVERAGE_SECTION
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'The Market Average was calculated using 8 hours worked.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('You cared for 7 patients')).toBeInTheDocument();
    expect(
      screen.getByText('The Market average was 5 patients')
    ).toBeInTheDocument();
  });
});
