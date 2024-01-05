import { render, screen } from '@testing-library/react';
import {
  AFTERNOON_GREETING,
  EVENING_GREETING,
  MORNING_GREETING,
  STATION_URL_QA,
} from './constants';
import GreetingHeader from './GreetingHeader';
import { GREETING_HEADER_TEST_IDS } from './TestIds';
import { MARKETS_DROPDOWN_TEST_IDS } from '../MarketsDropdown';
import {
  POSITION_DROPDOWN_TEST_IDS,
  ProfilePosition,
} from '../PositionDropdown';

jest.mock('statsig-js', () => ({
  checkGate: jest.fn(
    (gateName) => gateName === 'leads_view_individual_visibility'
  ),
}));

const handleMarketChange = jest.fn();
const handlePositionChange = jest.fn();

const props = {
  firstName: 'Sarah',
  visitsCompleted: 80,
  learnMoreLink: '/',
  lastUpdated: '2020-07-08T18:00:08.305Z',
  isLoading: false,
};

const testSelectedMarketId = '198';
const testSelectedPositionName = ProfilePosition.App;

describe('Header', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });

  it('should render correctly for morning', () => {
    jest.setSystemTime(new Date(2020, 3, 1, 8));

    const { asFragment } = render(
      <GreetingHeader
        selectedPositionName={testSelectedPositionName}
        selectedMarketId={testSelectedMarketId}
        handleMarketChange={handleMarketChange}
        handlePositionChange={handlePositionChange}
        stationURL={STATION_URL_QA}
        {...props}
      />
    );

    expect(asFragment()).toMatchSnapshot();
    expect(
      screen.getByTestId(GREETING_HEADER_TEST_IDS.GREETING_TEXT).textContent
    ).toContain(`${MORNING_GREETING}, ${props.firstName}`);
  });

  it('should render correctly for afternoon', () => {
    jest.setSystemTime(new Date(2020, 3, 1, 13));

    const { asFragment } = render(
      <GreetingHeader
        selectedPositionName={testSelectedPositionName}
        selectedMarketId={testSelectedMarketId}
        handleMarketChange={handleMarketChange}
        handlePositionChange={handlePositionChange}
        stationURL={STATION_URL_QA}
        {...props}
      />
    );

    expect(asFragment()).toMatchSnapshot();
    expect(
      screen.getByTestId(GREETING_HEADER_TEST_IDS.GREETING_TEXT).textContent
    ).toContain(`${AFTERNOON_GREETING}, ${props.firstName}`);
  });

  it('should render correctly for evening', () => {
    jest.setSystemTime(new Date(2020, 3, 1, 19));

    const { asFragment } = render(
      <GreetingHeader
        selectedPositionName={testSelectedPositionName}
        selectedMarketId={testSelectedMarketId}
        handleMarketChange={handleMarketChange}
        handlePositionChange={handlePositionChange}
        stationURL={STATION_URL_QA}
        {...props}
      />
    );

    expect(asFragment()).toMatchSnapshot();
    expect(
      screen.getByTestId(GREETING_HEADER_TEST_IDS.GREETING_TEXT).textContent
    ).toContain(`${EVENING_GREETING}, ${props.firstName}`);
  });

  it('should render correctly for Leads View', () => {
    jest.setSystemTime(new Date(2020, 3, 1, 10));
    render(
      <GreetingHeader
        markets={[{ name: 'COL', id: '1' }]}
        selectedPositionName={testSelectedPositionName}
        selectedMarketId={testSelectedMarketId}
        handleMarketChange={handleMarketChange}
        handlePositionChange={handlePositionChange}
        isLeadersView
        stationURL={STATION_URL_QA}
        {...props}
      />
    );

    const marketDropdownManagerLabel = screen.getByTestId(
      MARKETS_DROPDOWN_TEST_IDS.LABEL
    );
    const positionDropdownManagerLabel = screen.getByTestId(
      POSITION_DROPDOWN_TEST_IDS.LABEL
    );
    expect(marketDropdownManagerLabel).toBeVisible();
    expect(positionDropdownManagerLabel).toBeVisible();
  });

  it('should render correctly with placeholder', () => {
    jest.setSystemTime(new Date(2020, 3, 1, 19));

    render(
      <GreetingHeader
        selectedPositionName={testSelectedPositionName}
        selectedMarketId={testSelectedMarketId}
        handlePositionChange={handlePositionChange}
        handleMarketChange={handleMarketChange}
        stationURL={STATION_URL_QA}
        {...{ ...props, isLoading: true }}
      />
    );

    expect(
      screen.getByTestId(GREETING_HEADER_TEST_IDS.VISITS_COMPLETED_PLACEHOLDER)
    ).toBeTruthy();

    expect(
      screen.getByTestId(GREETING_HEADER_TEST_IDS.LAST_UPDATED_PLACEHOLDER)
    ).toBeTruthy();
  });

  afterAll(() => {
    jest.useRealTimers();
  });
});
