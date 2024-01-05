import { render, screen } from '../../../testUtils';
import NavigationBar, { NavigationBarProps } from './NavigationBar';
import { NAVIGATION_BAR_TEST_IDS } from './testIds';

const mockedProps: NavigationBarProps = {
  currentLocation: '/payers/1/',
  tabs: [
    {
      link: '/payers/1/',
      label: 'Payer Details',
    },
    {
      link: '/payers/1/networks',
      label: 'Networks',
    },
  ],
};

const setup = (overrideProps: Partial<NavigationBarProps> = {}) => {
  const getTab = (tabName: string) =>
    screen.getByTestId(NAVIGATION_BAR_TEST_IDS.getTabTestId(tabName));

  return {
    ...render(
      <NavigationBar {...mockedProps} {...overrideProps} />,
      {},
      undefined,
      true
    ),
    getTab,
  };
};

describe('<NavigationTabs />', () => {
  it('should render tabs', () => {
    const { getTab } = setup();

    mockedProps.tabs.forEach((tab) => {
      expect(getTab(tab.label)).toBeVisible();
    });
  });

  it('should have correct urls', () => {
    const { getTab } = setup();

    mockedProps.tabs.forEach((tab) => {
      expect(getTab(tab.label).getAttribute('href')).toEqual(tab.link);
    });
  });
});
