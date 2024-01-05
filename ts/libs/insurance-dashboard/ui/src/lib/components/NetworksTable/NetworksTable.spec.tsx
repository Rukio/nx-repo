import { render, screen, within } from '../../../testUtils';

import NetworksTable, {
  NetworksTableProps,
  NetworksSortDirection,
  NetworksSortField,
  MuiSortDirection,
} from './NetworksTable';
import { Network } from './NetworkTableRow';
import { NETWORKS_TABLE_TEST_IDS } from './testIds';

const mockedStateAbbrs: string[] = ['S1', 'S2'];

const mockedNetwork: Network = {
  id: 1,
  url: '/networks/1',
  name: 'WellMed - Amerigroup',
  stateAbbrs: mockedStateAbbrs,
  classification: 'Medicare Advantage',
  packageId: '670151',
  updatedAt: '2023-02-20T13:58:02.309Z',
};

const mockedProps: NetworksTableProps = {
  total: 1,
  page: 0,
  onChangePage: vi.fn(),
  rowsPerPage: 25,
  onChangeRowsPerPage: vi.fn(),
  onChangeSortOptions: vi.fn(),
  networks: [mockedNetwork],
  sortBy: NetworksSortField.NAME,
  sortDirection: MuiSortDirection.ASC,
};

const setup = (overrideProps: Partial<NetworksTableProps> = {}) => {
  const getRowsCountSelect = () =>
    screen.getByRole('button', { expanded: false });
  const findRowsCountOptions = () => screen.findAllByRole('option');
  const getPaginationPrevButton = () =>
    screen.getByTitle<HTMLButtonElement>(/Go to previous page/);
  const getPaginationNextButton = () =>
    screen.getByTitle<HTMLButtonElement>(/Go to next page/);
  const getSortLabel = (sortLabelTestId: string) =>
    screen.getByTestId(sortLabelTestId);

  return {
    ...render(
      <NetworksTable {...mockedProps} {...overrideProps} />,
      {},
      undefined,
      true
    ),
    getRowsCountSelect,
    findRowsCountOptions,
    getPaginationPrevButton,
    getPaginationNextButton,
    getSortLabel,
  };
};

describe('<NetworksTable />', () => {
  it('should render properly', () => {
    setup();
    const tableRoot = screen.getByTestId(NETWORKS_TABLE_TEST_IDS.ROOT);
    expect(tableRoot).toBeVisible();

    const tableHeaderCellTestIds = [
      NETWORKS_TABLE_TEST_IDS.HEADER_CELL_NETWORKS,
      NETWORKS_TABLE_TEST_IDS.HEADER_CELL_STATES,
      NETWORKS_TABLE_TEST_IDS.HEADER_CELL_NETWORK_CLASSIFICATION,
      NETWORKS_TABLE_TEST_IDS.HEADER_CELL_NETWORK_PACKAGE_ID,
      NETWORKS_TABLE_TEST_IDS.HEADER_CELL_LAST_UPDATED,
    ];

    tableHeaderCellTestIds.forEach((headerCellTestId) => {
      const headerCell = screen.getByTestId(headerCellTestId);
      expect(headerCell).toBeVisible();
    });

    const tableRow = screen.getByTestId(
      NETWORKS_TABLE_TEST_IDS.getNetworkRowTestId(mockedNetwork.id)
    );
    expect(tableRow).toBeVisible();

    const { getByTestId: withinRowGetByTestId } = within(tableRow);

    const stateCellTestId =
      NETWORKS_TABLE_TEST_IDS.getNetworkRowStateCellTestId(mockedNetwork.id);
    const stateCell = withinRowGetByTestId(stateCellTestId);
    expect(stateCell).toBeVisible();
    mockedStateAbbrs.forEach((state) => {
      const stateEl = withinRowGetByTestId(
        NETWORKS_TABLE_TEST_IDS.getNetworkRowStateCellValueTestId(
          mockedNetwork.id,
          state
        )
      );
      expect(stateEl).toBeVisible();
      expect(stateEl).toHaveTextContent(state);
    });

    const classificationCell = screen.getByTestId(
      NETWORKS_TABLE_TEST_IDS.getNetworkRowClassificationCellValueTestId(
        mockedNetwork.id
      )
    );
    expect(classificationCell).toHaveTextContent(mockedNetwork.classification);
    const packageIdCell = screen.getByTestId(
      NETWORKS_TABLE_TEST_IDS.getNetworkRowPackageIdCellValueTestId(
        mockedNetwork.id
      )
    );
    expect(packageIdCell).toHaveTextContent(mockedNetwork.packageId);
  });

  it('should render rows per page options', async () => {
    const rowsPerPageOptions = [10, 15, 25];
    const { user, getRowsCountSelect, findRowsCountOptions } = setup({
      rowsPerPageOptions,
    });

    const rowsCountSelect = getRowsCountSelect();
    await user.click(rowsCountSelect);

    const rowsCountOptions = await findRowsCountOptions();
    expect(rowsCountOptions.length).toEqual(rowsPerPageOptions.length);
    rowsCountOptions.forEach((option, index) => {
      expect(Number(option.getAttribute('data-value'))).toEqual(
        rowsPerPageOptions[index]
      );
    });
  });

  it('should call onChangeRowsPerPage on rows per page change', async () => {
    const rowsPerPageOptions = [10, 15, 25];
    const { user, getRowsCountSelect, findRowsCountOptions } = setup({
      rowsPerPageOptions,
    });

    const rowsCountSelect = getRowsCountSelect();
    await user.click(rowsCountSelect);

    const rowsCountOptions = await findRowsCountOptions();
    await user.click(rowsCountOptions[1]);

    expect(mockedProps.onChangeRowsPerPage).toBeCalledWith(
      rowsPerPageOptions[1]
    );
  });

  it('should change table pagination to the next page', async () => {
    const { getPaginationNextButton, getPaginationPrevButton, user } = setup({
      total: 40,
    });

    const prevButton = getPaginationPrevButton();
    const nextButton = getPaginationNextButton();

    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    await user.click(nextButton);
    expect(mockedProps.onChangePage).toBeCalledWith(mockedProps.page + 1);
  });

  it('should change table pagination to the previous page', async () => {
    const { getPaginationNextButton, getPaginationPrevButton, user } = setup({
      total: 60,
      rowsPerPage: 25,
      page: 2,
    });

    const prevButton = getPaginationPrevButton();
    const nextButton = getPaginationNextButton();

    expect(prevButton.disabled).toBeFalsy();
    expect(nextButton.disabled).toEqual(true);

    await user.click(prevButton);
    expect(mockedProps.onChangePage).toBeCalledWith(1);
  });

  it.each([
    {
      title: 'by name with asc order',
      sortLabelTestId:
        NETWORKS_TABLE_TEST_IDS.HEADER_CELL_NETWORKS_SORT_BY_NAME_LABEL,
      sortField: NetworksSortField.NAME,
      initialSortDirection: MuiSortDirection.DESC,
      newSortDirection: NetworksSortDirection.ASC,
    },
    {
      title: 'by name with desc order',
      sortLabelTestId:
        NETWORKS_TABLE_TEST_IDS.HEADER_CELL_NETWORKS_SORT_BY_NAME_LABEL,
      sortField: NetworksSortField.NAME,
      initialSortDirection: MuiSortDirection.ASC,
      newSortDirection: NetworksSortDirection.DESC,
    },
    {
      title: 'by updated_at with asc order',
      sortLabelTestId:
        NETWORKS_TABLE_TEST_IDS.HEADER_CELL_NETWORKS_SORT_BY_UPDATED_AT_LABEL,
      sortField: NetworksSortField.UPDATED_AT,
      initialSortDirection: MuiSortDirection.DESC,
      newSortDirection: NetworksSortDirection.ASC,
    },
    {
      title: 'by updated_at with desc order',
      sortLabelTestId:
        NETWORKS_TABLE_TEST_IDS.HEADER_CELL_NETWORKS_SORT_BY_UPDATED_AT_LABEL,
      sortField: NetworksSortField.UPDATED_AT,
      initialSortDirection: MuiSortDirection.ASC,
      newSortDirection: NetworksSortDirection.DESC,
    },
  ])(
    'sould sort networks $title',
    async ({
      sortField,
      initialSortDirection,
      newSortDirection,
      sortLabelTestId,
    }) => {
      vi.clearAllMocks();
      const { getSortLabel, user } = setup({
        sortBy: sortField,
        sortDirection: initialSortDirection,
      });

      const sortLabel = getSortLabel(sortLabelTestId);
      await user.click(sortLabel);

      expect(mockedProps.onChangeSortOptions).toBeCalledWith(
        sortField,
        newSortDirection
      );
    }
  );

  it('should render a network link', () => {
    setup();

    const networkId = mockedProps.networks[0].id;

    const tableRowLink = screen.getByTestId(
      NETWORKS_TABLE_TEST_IDS.getNetworkRowLinkTestId(networkId)
    );

    expect(tableRowLink).toBeVisible();
  });

  it('should expand table row by clicking on it and condense table row by clicking on it again', async () => {
    const { user } = setup();

    const tableRoot = screen.getByTestId(NETWORKS_TABLE_TEST_IDS.ROOT);
    expect(tableRoot).toBeVisible();

    const tableRow = screen.getByTestId(
      NETWORKS_TABLE_TEST_IDS.getNetworkRowTestId(mockedNetwork.id)
    );
    expect(tableRow).toBeVisible();
    expect(
      screen.getByTestId(
        NETWORKS_TABLE_TEST_IDS.getNetworkRowCollapsedTestId(mockedNetwork.id)
      )
    ).toBeVisible();

    await user.click(tableRow);

    expect(
      await screen.findByTestId(
        NETWORKS_TABLE_TEST_IDS.getNetworkRowExpandedTestId(mockedNetwork.id)
      )
    ).toBeVisible();

    await user.click(tableRow);

    expect(
      await screen.findByTestId(
        NETWORKS_TABLE_TEST_IDS.getNetworkRowCollapsedTestId(mockedNetwork.id)
      )
    ).toBeVisible();
  });

  it('should show hidden states count for collapsed table row', async () => {
    const mockedStateAbbrs = ['S1', 'S2', 'S3', 'S4', 'S5'];
    const maxStatesAmountForCollapsedRow = 4;
    const hiddenStatesCountForCollapsedRow =
      mockedStateAbbrs.length - maxStatesAmountForCollapsedRow;
    const { user } = setup({
      networks: [{ ...mockedNetwork, stateAbbrs: mockedStateAbbrs }],
    });

    const tableRow = screen.getByTestId(
      NETWORKS_TABLE_TEST_IDS.getNetworkRowTestId(mockedNetwork.id)
    );
    expect(tableRow).toBeVisible();
    expect(
      screen.getByTestId(
        NETWORKS_TABLE_TEST_IDS.getNetworkRowCollapsedTestId(mockedNetwork.id)
      )
    ).toBeVisible();

    const statesCellCollapsedCounter = screen.getByTestId(
      NETWORKS_TABLE_TEST_IDS.getNetworkRowCollapsedCounterChipsTestId(
        mockedNetwork.id
      )
    );
    expect(statesCellCollapsedCounter).toBeVisible();
    expect(statesCellCollapsedCounter).toHaveTextContent(
      `+${hiddenStatesCountForCollapsedRow}`
    );

    await user.click(tableRow);

    expect(
      await screen.findByTestId(
        NETWORKS_TABLE_TEST_IDS.getNetworkRowExpandedTestId(mockedNetwork.id)
      )
    ).toBeVisible();
    expect(statesCellCollapsedCounter).not.toBeInTheDocument();
  });

  it('should render expanded row', async () => {
    const mockedStateAbbrs = ['S1', 'S2', 'S3', 'S4', 'S5'];
    const { user } = setup({
      networks: [{ ...mockedNetwork, stateAbbrs: mockedStateAbbrs }],
    });

    const tableRow = screen.getByTestId(
      NETWORKS_TABLE_TEST_IDS.getNetworkRowTestId(mockedNetwork.id)
    );

    await user.click(tableRow);

    expect(
      await screen.findByTestId(
        NETWORKS_TABLE_TEST_IDS.getNetworkRowExpandedTestId(mockedNetwork.id)
      )
    ).toBeVisible();

    const { getByTestId: withinRowGetByTestId } = within(tableRow);

    mockedStateAbbrs.forEach((stateAbbr) => {
      const stateAbbrChip = withinRowGetByTestId(
        NETWORKS_TABLE_TEST_IDS.getNetworkRowStateCellValueTestId(
          mockedNetwork.id,
          stateAbbr
        )
      );
      expect(stateAbbrChip).toBeVisible();
      expect(stateAbbrChip).toHaveTextContent(stateAbbr);
    });
  });
});
