import {
  FORM_CONTROLS_TEST_IDS,
  MuiSortDirection,
  NETWORKS_TABLE_TEST_IDS,
  NETWORK_FORM_TEST_IDS,
  NetworksTableProps,
} from '@*company-data-covered*/insurance/ui';
import {
  environment,
  NETWORKS_API_PATH,
  NETWORK_API_SEARCH_FRAGMENT,
  mockedInsuranceNetwork,
  mockedInsurancePayer,
  mockedInsuranceNetworksList,
  DomainInsuranceNetwork,
  NetworksSortDirection,
  NetworksSortField,
} from '@*company-data-covered*/insurance/data-access';
import {
  render,
  screen,
  waitFor,
  within,
  waitForElementToBeRemoved,
} from '../../testUtils';
import NetworksList from './NetworksList';
import { rest } from 'msw';
import { mswServer } from '../../testUtils/server';
import NetworksCreate from '../NetworksCreate/NetworksCreate';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

const DEFAULT_PER_PAGE = 10;

const mockedNetworksTableData: NetworksTableProps = {
  total: 1,
  page: 0,
  onChangePage: (page: number) => page,
  rowsPerPage: 25,
  onChangeSortOptions: (
    sortBy: NetworksSortField,
    sortOrder: NetworksSortDirection
  ) => ({ sortBy, sortOrder }),
  sortBy: NetworksSortField.NAME,
  sortDirection: MuiSortDirection.ASC,
  networks: [
    {
      id: 1,
      name: 'My Network',
      url: '/payers/1/networks/1',
      stateAbbrs: ['AZ', 'CA', 'CO'],
      classification: 'Aetna',
      packageId: '670151',
      updatedAt: '2023-02-20T13:58:02.309Z',
    },
  ],
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );

  return {
    ...actual,
    useParams: vi.fn(() => ({ payerId: mockedInsurancePayer.id })),
  };
});

const getMockedInsuranceNetworks = (count: number) =>
  Array.from(Array(count), (_, index) => ({
    ...mockedInsuranceNetwork,
    name: mockedInsuranceNetwork.name + index,
    id: mockedInsuranceNetwork.id + index,
  }));

const queryEmptyNetworksTableCount = () => {
  const pagination = screen.getByTestId(
    NETWORKS_TABLE_TEST_IDS.TABLE_PAGINATION
  );

  return within(pagination).queryByText(/0–0/);
};
const getPaginationPrevButton = () =>
  screen.getByTitle<HTMLButtonElement>('Go to previous page');

const getPaginationNextButton = () =>
  screen.getByTitle<HTMLButtonElement>('Go to next page');

const getPaginationSelectButton = () => {
  const pagination = screen.getByTestId(
    NETWORKS_TABLE_TEST_IDS.TABLE_PAGINATION
  );

  return within(pagination).getByRole('button', {
    name: new RegExp(DEFAULT_PER_PAGE.toString(), 'i'),
  });
};

const getPaginationSelectOption = (option: string) =>
  screen.getByRole('option', { name: new RegExp(option, 'i') });

const findTableRowHeaders = () => {
  const table = screen.getByTestId(NETWORKS_TABLE_TEST_IDS.ROOT);

  return within(table).findAllByTestId(
    new RegExp(NETWORKS_TABLE_TEST_IDS.TABLE_ROW_PREFIX)
  );
};

const getHeaderCellNetworks = () =>
  screen.getByTestId(NETWORKS_TABLE_TEST_IDS.HEADER_CELL_NETWORKS);

const getHeaderCellLastUpdated = () =>
  screen.getByTestId(NETWORKS_TABLE_TEST_IDS.HEADER_CELL_LAST_UPDATED);

const getSortByNameLabel = () =>
  screen.getByTestId(
    NETWORKS_TABLE_TEST_IDS.HEADER_CELL_NETWORKS_SORT_BY_NAME_LABEL
  );

const getSortByUpdatedAtLabel = () =>
  screen.getByTestId(
    NETWORKS_TABLE_TEST_IDS.HEADER_CELL_NETWORKS_SORT_BY_UPDATED_AT_LABEL
  );

const setup = (mockedInsuranceNetworks = [mockedInsuranceNetwork]) => {
  mswServer.use(
    rest.post(
      `${environment.serviceURL}${NETWORKS_API_PATH}/${NETWORK_API_SEARCH_FRAGMENT}`,
      (_req, res, ctx) => {
        return res.once(
          ctx.status(200),
          ctx.json({
            networks: mockedInsuranceNetworks,
          })
        );
      }
    )
  );

  return render(<NetworksList />);
};

const setupWithNetworksCreateForm = () =>
  render(
    <>
      <NetworksCreate />
      <NetworksList />
    </>,
    { withRouter: true }
  );

describe('<NetworksList />', () => {
  it('should render properly', () => {
    render(<NetworksList />);
    const table = screen.getByTestId(NETWORKS_TABLE_TEST_IDS.ROOT);

    expect(table).toBeVisible();
  });

  it('should render table row links', async () => {
    setup();

    const table = screen.getByTestId(NETWORKS_TABLE_TEST_IDS.ROOT);

    expect(table).toBeVisible();

    const networkId = mockedNetworksTableData.networks[0].id;

    await waitFor(() =>
      expect(
        screen.getByTestId(
          NETWORKS_TABLE_TEST_IDS.getNetworkRowLinkTestId(networkId)
        )
      ).toBeVisible()
    );
    mockedNetworksTableData.networks.forEach((network) => {
      const tableRowLink = screen.getByTestId(
        NETWORKS_TABLE_TEST_IDS.getNetworkRowLinkTestId(network.id)
      );

      expect(tableRowLink).toBeVisible();
    });
  });

  it('links should have a correct url', async () => {
    setup();

    const table = screen.getByTestId(NETWORKS_TABLE_TEST_IDS.ROOT);

    expect(table).toBeVisible();

    const networkId = mockedNetworksTableData.networks[0].id;
    const networkURL = mockedNetworksTableData.networks[0].url;

    await waitFor(() =>
      expect(
        screen.getByTestId(
          NETWORKS_TABLE_TEST_IDS.getNetworkRowLinkTestId(networkId)
        )
      ).toHaveAttribute('href', networkURL)
    );
  });

  it(`should see next 10 networks after proceeding to next page if number of payers >= 20`, async () => {
    const mockedInsuranceNetworks = getMockedInsuranceNetworks(
      DEFAULT_PER_PAGE * 2
    );

    const { user } = setup(mockedInsuranceNetworks);

    await waitForElementToBeRemoved(() => queryEmptyNetworksTableCount());

    const paginationSelectButton = getPaginationSelectButton();
    await user.click(paginationSelectButton);

    const paginationSelectOption = getPaginationSelectOption(
      String(DEFAULT_PER_PAGE)
    );
    await user.click(paginationSelectOption);

    const nextPageButton = getPaginationNextButton();
    expect(nextPageButton).not.toBeDisabled();
    await user.click(nextPageButton);

    const tableRowHeaders = await findTableRowHeaders();
    expect(tableRowHeaders[0]).toHaveTextContent(
      mockedInsuranceNetworks[DEFAULT_PER_PAGE].name
    );
  });

  it(`should see first 10 networks after proceeding back to first page`, async () => {
    const mockedInsuranceNetworks = getMockedInsuranceNetworks(
      DEFAULT_PER_PAGE * 2
    );

    const { user } = setup(mockedInsuranceNetworks);

    await waitForElementToBeRemoved(() => queryEmptyNetworksTableCount());

    const paginationSelectButton = getPaginationSelectButton();
    await user.click(paginationSelectButton);

    const paginationSelectOption = getPaginationSelectOption(
      String(DEFAULT_PER_PAGE)
    );
    await user.click(paginationSelectOption);

    const nextPageButton = getPaginationNextButton();
    await user.click(nextPageButton);

    const previousPageButton = getPaginationPrevButton();
    await user.click(previousPageButton);

    const tableRowHeaders = await findTableRowHeaders();

    expect(tableRowHeaders[0]).toHaveTextContent(
      mockedInsuranceNetworks[0].name
    );
  });

  it(`should see next/back buttons disabled if there are < 10 networks overall`, async () => {
    const mockedInsuranceNetworks = getMockedInsuranceNetworks(
      DEFAULT_PER_PAGE - 1
    );

    const { user } = setup(mockedInsuranceNetworks);

    await waitForElementToBeRemoved(() => queryEmptyNetworksTableCount());

    const paginationSelectButton = getPaginationSelectButton();
    await user.click(paginationSelectButton);

    const paginationSelectOption = getPaginationSelectOption(
      String(DEFAULT_PER_PAGE)
    );
    await user.click(paginationSelectOption);

    const previousPageButton = getPaginationPrevButton();
    expect(previousPageButton).toBeDisabled();

    const nextPageButton = getPaginationNextButton();
    expect(nextPageButton).toBeDisabled();
    mswServer.resetHandlers();
  });

  it('should display updated networks list in table after creating a new network', async () => {
    const { user, rerender, store } = setupWithNetworksCreateForm();

    const table = screen.getByTestId(NETWORKS_TABLE_TEST_IDS.ROOT);
    const tableRowNetworkLinks = await within(table).findAllByTestId(
      new RegExp(NETWORKS_TABLE_TEST_IDS.TABLE_ROW_LINK_PREFIX)
    );
    expect(tableRowNetworkLinks.length).toEqual(
      mockedInsuranceNetworksList.length
    );

    const networkNameInput = await screen.findByTestId(
      NETWORK_FORM_TEST_IDS.NAME_INPUT
    );
    const mockedNewNetworkName = 'New network';

    await user.type(networkNameInput, mockedNewNetworkName);
    expect(networkNameInput).toHaveValue(mockedNewNetworkName);

    const submitButton = screen.getByTestId(
      FORM_CONTROLS_TEST_IDS.SUBMIT_BUTTON
    );
    await user.click(submitButton);

    const updatedMockedInsuranceNetworksList: DomainInsuranceNetwork[] = [
      ...mockedInsuranceNetworksList,
      {
        ...mockedInsuranceNetwork,
        id: mockedInsuranceNetworksList.length + 1,
        name: mockedNewNetworkName,
      },
    ];

    mswServer.use(
      rest.post(
        `${environment.serviceURL}${NETWORKS_API_PATH}/${NETWORK_API_SEARCH_FRAGMENT}`,
        (_req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              networks: updatedMockedInsuranceNetworksList,
            })
          );
        }
      )
    );

    rerender(
      <MemoryRouter>
        <Provider store={store}>
          <NetworksList />
        </Provider>
      </MemoryRouter>
    );

    const updatedTable = await screen.findByTestId(
      NETWORKS_TABLE_TEST_IDS.ROOT
    );
    const updatedTableRowNetworkLinks = await within(
      updatedTable
    ).findAllByTestId(
      new RegExp(NETWORKS_TABLE_TEST_IDS.TABLE_ROW_LINK_PREFIX)
    );

    expect(updatedTableRowNetworkLinks.length).toEqual(
      updatedMockedInsuranceNetworksList.length
    );
  });

  it('should display networks list sorted by name with asc order by default and change to desc when clicked on Networks header', async () => {
    const { user } = setup();

    const sortByNameLabel = getSortByNameLabel();
    const headerCellNetworks = getHeaderCellNetworks();

    expect(headerCellNetworks).toHaveAttribute('aria-sort', 'ascending');

    await user.click(sortByNameLabel);

    await waitFor(() => {
      expect(headerCellNetworks).toHaveAttribute('aria-sort', 'descending');
    });
  });

  it(`should display networks list sorted by name with asc order by default,
    sort by updated_at with asc order when clicked on Last Updated header,
    and sort by updated_at with desc order when clicked on Last Updated header second time`, async () => {
    const { user } = setup();

    const sortByUpdatedAtLabel = getSortByUpdatedAtLabel();
    const headerCellLastUpdated = getHeaderCellLastUpdated();
    const headerCellNetworks = getHeaderCellNetworks();

    expect(headerCellNetworks).toHaveAttribute('aria-sort', 'ascending');

    await user.click(sortByUpdatedAtLabel);

    await waitFor(() => {
      expect(headerCellLastUpdated).toHaveAttribute('aria-sort', 'ascending');
    });

    await user.click(sortByUpdatedAtLabel);

    await waitFor(() => {
      expect(headerCellLastUpdated).toHaveAttribute('aria-sort', 'descending');
    });
  });
});
