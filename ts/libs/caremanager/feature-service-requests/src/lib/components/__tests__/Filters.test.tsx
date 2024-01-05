import * as utilsReact from '@*company-data-covered*/caremanager/utils-react';
import * as DesignSystem from '@*company-data-covered*/design-system';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import { Filters } from '../Filters';
import { FiltersProvider } from '../FiltersContext';

const ATLANTA_MARKET_ID = '177';
const ATLANTA_MARKET_NAME = 'Atlanta';
const DENVER_MARKET_ID = '159';

const INITIAL_SEARCH_TERM = 'tom';
const INITIAL_MARKET_IDS = [DENVER_MARKET_ID];

const setSearchParamsSpy = vi.fn();
vi.mock('@*company-data-covered*/caremanager/utils-react', async () => {
  const actual = await vi.importActual<typeof utilsReact>(
    '@*company-data-covered*/caremanager/utils-react'
  );

  return {
    ...actual,
    useSearchParams: () => ({
      searchParams: {
        get: () => INITIAL_SEARCH_TERM,
        getAll: () => INITIAL_MARKET_IDS,
      },
      searchParamsObject: {
        searchTerm: INITIAL_SEARCH_TERM,
        marketIds: INITIAL_MARKET_IDS,
      },
      setSearchParams: setSearchParamsSpy,
    }),
  };
});

const mediaQuerySpy = vi.spyOn(DesignSystem, 'useMediaQuery');

const setup = (isMobile = false) => {
  mediaQuerySpy.mockReturnValue(isMobile);
  utilsReact.renderWithClient(
    <FiltersProvider>
      <Filters />
    </FiltersProvider>
  );
};

describe('FiltersContext', () => {
  afterEach(() => vi.clearAllMocks());

  it('should set a search term', async () => {
    setup();

    const searchTermInput = await screen.findByTestId(
      'service-requests-search-term-input'
    );
    fireEvent.change(searchTermInput, { target: { value: 'nadja' } });

    await waitFor(() =>
      expect(setSearchParamsSpy).toHaveBeenCalledWith({
        searchTerm: 'nadja',
        marketIds: INITIAL_MARKET_IDS,
      })
    );
  });

  it('should add a market id to the existing selection', async () => {
    setup();

    const marketIdsFilter = await screen.findByTestId(
      'service-requests-market-ids-filter'
    );
    expect(marketIdsFilter).toBeInTheDocument();
    fireEvent.click(marketIdsFilter);

    const anchorageOption = await screen.findByText(ATLANTA_MARKET_NAME);
    fireEvent.click(anchorageOption);

    await waitFor(() =>
      expect(setSearchParamsSpy).toHaveBeenCalledWith({
        marketIds: [...INITIAL_MARKET_IDS, ATLANTA_MARKET_ID],
        searchTerm: INITIAL_SEARCH_TERM,
      })
    );
  });

  it('should display status filter in mobile', async () => {
    setup(true);
    expect(
      await screen.findByTestId('service-request-status-filter')
    ).toBeInTheDocument();
  });
});
