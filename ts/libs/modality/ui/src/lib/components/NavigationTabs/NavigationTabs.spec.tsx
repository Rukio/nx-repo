import { render, screen } from '@testing-library/react';

import NavigationTabs from './NavigationTabs';
import { NAVIGATION_TEST_IDS } from './testIds';

const mockedProps = {
  stationURL: 'https://station-url',
};

describe('<NavigationTabs />', () => {
  it('should render properly', () => {
    const { asFragment } = render(<NavigationTabs {...mockedProps} />);

    expect(asFragment()).toMatchSnapshot();
  });

  it('should have proper urls to dashboard', () => {
    render(<NavigationTabs {...mockedProps} />);

    const dashboardMarketsLink = screen.getByTestId(
      NAVIGATION_TEST_IDS.STATION_MARKETS_LINK
    );
    const dashboardStatesLink = screen.getByTestId(
      NAVIGATION_TEST_IDS.STATION_STATES_LINK
    );

    expect(dashboardMarketsLink).toBeTruthy();
    expect(dashboardStatesLink).toBeTruthy();

    expect(dashboardMarketsLink.getAttribute('href')).toEqual(
      `${mockedProps.stationURL}/admin/markets`
    );
    expect(dashboardStatesLink.getAttribute('href')).toEqual(
      `${mockedProps.stationURL}/admin/states`
    );
  });
});
