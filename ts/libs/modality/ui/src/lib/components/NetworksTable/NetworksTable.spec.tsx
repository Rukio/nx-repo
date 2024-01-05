import { render, screen, within } from '../../testUtils';
import { format } from 'date-fns';
import { NETWORKS_TABLE_TEST_IDS } from './testIds';

import NetworksTable, {
  NetworksTableProps,
  Modality,
  InsuranceNetwork,
  NetworksSortOrder,
  NetworksSortBy,
} from './NetworksTable';

const mockedInsuranceNetworks: InsuranceNetwork[] = [
  {
    id: 1,
    name: 'Network 1',
    updatedAt: '2023-05-05',
  },
  {
    id: 2,
    name: 'Network 2',
    updatedAt: '2023-05-06',
  },
  {
    id: 3,
    name: 'Network 3',
    updatedAt: '2023-05-07',
  },
];

const mockedModalities: Modality[] = [
  { id: 1, displayName: 'In-Person', type: 'in_person' },
  { id: 2, displayName: 'Virtual', type: 'virtual' },
];

const mockedProps: NetworksTableProps = {
  networks: mockedInsuranceNetworks,
  modalities: mockedModalities,
  page: 0,
  rowsPerPage: 10,
  total: mockedInsuranceNetworks.length,
  sortOrder: NetworksSortOrder.ASC,
  sortBy: NetworksSortBy.NAME,
  selectedModalities: {
    [mockedInsuranceNetworks[0].id]: [mockedModalities[0].id],
  },
  onChangePage: jest.fn(),
  onChangeRowsPerPage: jest.fn(),
  onChangeSortBy: jest.fn(),
  onChangeSortOrder: jest.fn(),
};

const getTableRows = () => {
  return screen.getAllByTestId(
    new RegExp(NETWORKS_TABLE_TEST_IDS.TABLE_ROW_PREFIX)
  );
};
const getTableHeadCellName = () => {
  return screen.getByTestId(NETWORKS_TABLE_TEST_IDS.TABLE_HEAD_CELL_NAME);
};
const getTableHeadCellUpdatedAt = () => {
  return screen.getByTestId(
    NETWORKS_TABLE_TEST_IDS.TABLE_HEAD_CELL_LAST_UPDATED
  );
};
const getTableHeadCellsModality = () => {
  return screen.getAllByTestId(
    NETWORKS_TABLE_TEST_IDS.TABLE_HEAD_CELL_MODALITY
  );
};
const getTableNetworkRow = (networkId: number) => {
  return screen.getByTestId(
    NETWORKS_TABLE_TEST_IDS.getNetworkRowTestId(networkId)
  );
};
const getTableNetworkRowName = (networkId: number) => {
  return within(getTableNetworkRow(networkId)).getByTestId(
    NETWORKS_TABLE_TEST_IDS.TABLE_CELL_NAME
  );
};
const getTableNetworkRowUpdateAt = (networkId: number) => {
  return within(getTableNetworkRow(networkId)).getByTestId(
    NETWORKS_TABLE_TEST_IDS.TABLE_CELL_LAST_UPDATED
  );
};
const getTableNetworkRowModality = (networkId: number, modalityId: number) => {
  return within(getTableNetworkRow(networkId)).getByTestId(
    NETWORKS_TABLE_TEST_IDS.getModalityCellTestId(modalityId)
  );
};
const getTablePageSizeSelect = () => {
  return screen.getByRole('button', { expanded: false });
};
const findTablePageSizeOptions = () => {
  return screen.findAllByRole('option');
};
const getTablePaginationPrevButton = () => {
  return screen.getByTitle<HTMLButtonElement>(/Go to previous page/);
};
const getTablePaginationNextButton = () => {
  return screen.getByTitle<HTMLButtonElement>(/Go to next page/);
};
const getHeadCellSortLabelName = () => {
  return screen.getByTestId(NETWORKS_TABLE_TEST_IDS.TABLE_NAME_SORT_LABEL);
};
const getHeadCellSortLabeUpdatedAt = () => {
  return screen.getByTestId(
    NETWORKS_TABLE_TEST_IDS.TABLE_LAST_UPDATED_SORT_LABEL
  );
};

const setup = (overrideProps: Partial<NetworksTableProps> = {}) => {
  return render(<NetworksTable {...mockedProps} {...overrideProps} />);
};

describe('<NetworksTable />', () => {
  it('should render properly', () => {
    setup();

    // test table head renders properly.
    const headCellName = getTableHeadCellName();
    const headCellModalities = getTableHeadCellsModality();
    const headCellUpdateAt = getTableHeadCellUpdatedAt();

    expect(headCellName).toHaveTextContent('Network Name');
    expect(headCellUpdateAt).toHaveTextContent('Last Updated Date');
    headCellModalities.forEach((modalityCell, i) => {
      expect(modalityCell).toHaveTextContent(
        mockedProps.modalities[i].displayName
      );
    });

    // test table rows renders properly
    const tableRows = getTableRows();
    expect(tableRows.length).toEqual(mockedProps.networks.length);

    mockedProps.networks.forEach((network) => {
      const cellName = getTableNetworkRowName(network.id);
      const cellUpdatedAt = getTableNetworkRowUpdateAt(network.id);

      expect(cellName).toHaveTextContent(network.name);
      expect(cellUpdatedAt).toHaveTextContent(
        format(new Date(network.updatedAt), 'M/d/yyyy')
      );
    });

    // should render active mark for selected modality.
    const selectedNetwork = mockedProps.networks[0];
    const selectedModality = mockedProps.modalities[0];
    const notSelectedModality = mockedProps.modalities[1];

    const selectedNetworkRowModalityCellCheckedIcon = within(
      getTableNetworkRowModality(selectedNetwork.id, selectedModality.id)
    ).queryByTestId(NETWORKS_TABLE_TEST_IDS.TABLE_CELL_MODALITY_CHECK_ICON);
    const notSelectedNetworkRowModalityCellCheckedIcon = within(
      getTableNetworkRowModality(selectedNetwork.id, notSelectedModality.id)
    ).queryByTestId(NETWORKS_TABLE_TEST_IDS.TABLE_CELL_MODALITY_CHECK_ICON);

    expect(selectedNetworkRowModalityCellCheckedIcon).toBeVisible();
    expect(
      notSelectedNetworkRowModalityCellCheckedIcon
    ).not.toBeInTheDocument();
  });

  it('should change table sort', async () => {
    const { user } = setup();

    const headCellNameSortLabel = getHeadCellSortLabelName();
    const headCellUpdateAtSortLabel = getHeadCellSortLabeUpdatedAt();

    await user.click(headCellNameSortLabel);

    expect(mockedProps.onChangeSortOrder).toBeCalledWith(
      NetworksSortOrder.DESC
    );
    expect(mockedProps.onChangeSortBy).toBeCalledWith(NetworksSortBy.NAME);

    await user.click(headCellUpdateAtSortLabel);

    expect(mockedProps.onChangeSortOrder).toBeCalledWith(NetworksSortOrder.ASC);
    expect(mockedProps.onChangeSortBy).toBeCalledWith(
      NetworksSortBy.UPDATED_AT
    );
  });

  it('should change table pagination options', async () => {
    const mockedRowsPerPageOptions = [1, 5, 10];
    const { user } = setup({
      page: 1,
      rowsPerPage: 1,
      rowsPerPageOptions: mockedRowsPerPageOptions,
    });

    const prevButton = getTablePaginationPrevButton();
    const nextButton = getTablePaginationNextButton();

    await user.click(prevButton);
    expect(mockedProps.onChangePage).toBeCalledWith(0);

    await user.click(nextButton);
    expect(mockedProps.onChangePage).toBeCalledWith(2);

    const pageSizeSelect = getTablePageSizeSelect();

    await user.click(pageSizeSelect);

    const pageSizeOptions = await findTablePageSizeOptions();
    pageSizeOptions.forEach((option, i) => {
      expect(option).toHaveTextContent(mockedRowsPerPageOptions[i].toString());
    });

    await user.click(pageSizeOptions[1]);
    expect(mockedProps.onChangeRowsPerPage).toBeCalledWith(
      mockedRowsPerPageOptions[1]
    );
  });
});
