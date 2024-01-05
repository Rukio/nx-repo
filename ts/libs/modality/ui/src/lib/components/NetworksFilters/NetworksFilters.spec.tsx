import { render, screen, within } from '../../testUtils';
import NetworksFilters, {
  NetworksFiltersProps,
  Market,
} from './NetworksFilters';
import { NETWORKS_FILTERS_TEST_IDS } from './testIds';

const mockedMarkets: Market[] = [
  {
    id: 1,
    name: 'Denver',
    shortName: 'DEN',
    state: 'CO',
  },
  {
    id: 2,
    name: 'Boise',
    shortName: 'BOI',
    state: 'BOS',
  },
];

const mockedMarket: Market = mockedMarkets[0];

const mockedNetworksFiltersProps: NetworksFiltersProps = {
  markets: mockedMarkets,
  selectedMarket: mockedMarket,
  defaultSearch: 'test',
  onChangeSearch: jest.fn(),
  onChangeMarket: jest.fn(),
};

const getNetworksMarketSelectButton = () =>
  within(screen.getByTestId(NETWORKS_FILTERS_TEST_IDS.MARKET_SELECT)).getByRole(
    'button'
  );
const findAllNetworksMarketSelectOptions = () =>
  screen.findAllByTestId(NETWORKS_FILTERS_TEST_IDS.MARKET_SELECT_OPTION);
const getNetworksSearchField = () =>
  screen.getByTestId(NETWORKS_FILTERS_TEST_IDS.SEARCH_FIELD);

const setup = (overrideProps: Partial<NetworksFiltersProps> = {}) => {
  return render(
    <NetworksFilters {...mockedNetworksFiltersProps} {...overrideProps} />
  );
};

describe('<NetworksFilters />', () => {
  it('should render properly', async () => {
    const { user } = setup();

    const marketSelectButton = getNetworksMarketSelectButton();
    expect(marketSelectButton).toBeVisible();

    const searchField = getNetworksSearchField();
    expect(searchField).toBeVisible();
    expect(searchField).toHaveValue(mockedNetworksFiltersProps.defaultSearch);

    await user.click(marketSelectButton);
    const marketSelectOptions = await findAllNetworksMarketSelectOptions();
    expect(marketSelectOptions.length).toEqual(
      mockedNetworksFiltersProps.markets.length
    );
    marketSelectOptions.forEach((marketOption, index) => {
      expect(marketOption).toHaveTextContent(
        mockedNetworksFiltersProps.markets[index].name
      );
    });
  });

  it('should call onChangeSearch', async () => {
    const mockedNewSearch = 'new value';
    const { user } = setup({ defaultSearch: '' });

    const searchField = getNetworksSearchField();
    expect(searchField).toBeVisible();

    await user.type(searchField, mockedNewSearch);
    expect(mockedNetworksFiltersProps.onChangeSearch).toBeCalledWith(
      mockedNewSearch
    );
  });

  it('should call onChangeMarket', async () => {
    const { user } = setup();
    const marketSelectButton = getNetworksMarketSelectButton();

    await user.click(marketSelectButton);
    const marketSelectOptions = await findAllNetworksMarketSelectOptions();
    const newMarketSelectOption = marketSelectOptions[1];
    const newMarket = mockedMarkets[1];
    await user.click(newMarketSelectOption);

    expect(mockedNetworksFiltersProps.onChangeMarket).toBeCalledTimes(1);
    expect(mockedNetworksFiltersProps.onChangeMarket).toBeCalledWith(
      newMarket.id
    );
  });
});
