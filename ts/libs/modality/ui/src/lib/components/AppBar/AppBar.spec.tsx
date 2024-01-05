import { render, screen } from '@testing-library/react';

import AppBar from './AppBar';
import { APP_BAR_TEST_IDS } from './testIds';

const mockedProps = {
  stationURL: 'station-url',
};

describe('<AppBar />', () => {
  it('should render properly', () => {
    const { asFragment } = render(<AppBar {...mockedProps} />);

    expect(asFragment()).toMatchSnapshot();
  });

  it('should have url to dashboard', () => {
    render(<AppBar {...mockedProps} />);

    const dashboardLink = screen.getByTestId(APP_BAR_TEST_IDS.STATION_LINK);
    expect(dashboardLink).toBeTruthy();
    expect(dashboardLink.getAttribute('href')).toEqual(mockedProps.stationURL);
  });
});
