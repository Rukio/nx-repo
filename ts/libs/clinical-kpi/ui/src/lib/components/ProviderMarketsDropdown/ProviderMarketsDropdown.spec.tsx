import { render, screen } from '../../../testUtils';
import {
  ProviderMarket,
  ProviderMarketsDropdown,
  ProviderMarketsDropdownProps,
} from './ProviderMarketsDropdown';
import { providerMarketsListMock } from './mocks';
import { PROVIDER_MARKETS_DROPDOWN_TEST_IDS } from './TestIds';

const onMarketChange = jest.fn().mockImplementation((id: number) => undefined);

const setup = (
  markets: ProviderMarketsDropdownProps['markets'] = providerMarketsListMock
) => {
  const getMarketDropdown = () =>
    screen.getByRole('button', {
      ...screen.getByTestId(PROVIDER_MARKETS_DROPDOWN_TEST_IDS.SELECT),
      expanded: false,
    });

  const getMarketDropdownItem = (marketId: ProviderMarket['id']) =>
    screen.getByTestId(
      PROVIDER_MARKETS_DROPDOWN_TEST_IDS.SELECT_ITEM(marketId)
    );

  return {
    ...render(
      <ProviderMarketsDropdown onChange={onMarketChange} markets={markets} />
    ),
    getMarketDropdown,
    getMarketDropdownItem,
  };
};

describe('ProviderMarketsDropdown', () => {
  it('should render correctly', async () => {
    const { user, baseElement, getMarketDropdownItem, getMarketDropdown } =
      setup();

    const selectElement = getMarketDropdown();
    await user.click(selectElement);

    providerMarketsListMock.forEach((market) => {
      expect(getMarketDropdownItem(market.id)).toBeVisible();
    });

    expect(baseElement).toMatchSnapshot();
  });

  it('should call onChange function when select new market', async () => {
    const { user, getMarketDropdownItem, getMarketDropdown } = setup();

    const selectElement = getMarketDropdown();

    await user.click(selectElement);

    const marketToSelect = providerMarketsListMock[0];
    const marketDropdownItemToSelect = getMarketDropdownItem(marketToSelect.id);

    await user.click(marketDropdownItemToSelect);

    expect(onMarketChange).toBeCalledTimes(1);
    expect(onMarketChange).toBeCalledWith(marketToSelect.id);
  });

  it('should be disabled when no markets provided', async () => {
    const { getMarketDropdown } = setup([]);

    const selectElement = getMarketDropdown();
    expect(selectElement).toHaveAttribute('aria-disabled', 'true');
  });
});
