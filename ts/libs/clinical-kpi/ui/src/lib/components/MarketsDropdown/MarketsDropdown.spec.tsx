import { render, screen } from '../../../testUtils';
import MarketsDropdown, {
  Market,
  MarketsDropdownProps,
} from './MarketsDropdown';
import { MARKETS_DROPDOWN_TEST_IDS } from './TestIds';
import { marketsListMock } from './mocks';

const onMarketChange = jest.fn().mockImplementation((id: string) => undefined);

const setup = (markets: MarketsDropdownProps['markets'] = marketsListMock) => {
  const getMarketDropdown = () =>
    screen.getByRole('button', {
      ...screen.getByTestId(MARKETS_DROPDOWN_TEST_IDS.SELECT),
      expanded: false,
    });

  const getMarketDropdownItem = (marketId: Market['id']) =>
    screen.getByTestId(MARKETS_DROPDOWN_TEST_IDS.SELECT_ITEM(marketId));

  return {
    ...render(
      <MarketsDropdown onMarketChange={onMarketChange} markets={markets} />
    ),
    getMarketDropdown,
    getMarketDropdownItem,
  };
};

describe('MarketsDropdown', () => {
  it('should render correctly', async () => {
    const { user, baseElement, getMarketDropdownItem, getMarketDropdown } =
      setup();

    const selectElement = getMarketDropdown();

    expect(
      screen.getByTestId(MARKETS_DROPDOWN_TEST_IDS.LABEL).textContent
    ).toContain('Market');

    await user.click(selectElement);

    marketsListMock.forEach((market) => {
      expect(getMarketDropdownItem(market.id)).toBeVisible();
    });

    expect(baseElement).toMatchSnapshot();
  });

  it('should call onMarketChange function when select new market', async () => {
    const { user, getMarketDropdownItem, getMarketDropdown } = setup();

    const selectElement = getMarketDropdown();

    await user.click(selectElement);

    const marketToSelect = marketsListMock[0];
    const marketDropdownItemToSelect = getMarketDropdownItem(marketToSelect.id);

    await user.click(marketDropdownItemToSelect);

    expect(onMarketChange).toBeCalledTimes(1);
    expect(onMarketChange).toBeCalledWith(marketToSelect.id);
  });
});
