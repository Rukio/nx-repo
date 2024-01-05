import { render, screen, within } from '../../../testUtils';
import PayersTable, {
  PayersTableProps,
  PayersSortDirection,
  PayersSortFields,
} from './PayersTable';
import { Payer, isTruncated } from './PayersTableRow';
import { PAYERS_TABLE_TEST_IDS } from './testIds';

type PayersTablePropsType = Omit<PayersTableProps, 'payers'> & {
  payers: Required<Payer>[];
};

const mockedProps: PayersTablePropsType = {
  total: 1,
  sortField: PayersSortFields.NAME,
  sortOrder: PayersSortDirection.ASC,
  page: 0,
  onChangePage: vi.fn(),
  rowsPerPage: 25,
  onChangeRowsPerPage: vi.fn(),
  onChangeSortOrder: vi.fn(),
  payers: [
    {
      id: 1,
      name: 'Test payer',
      insuranceNetworks: [
        { id: 1, name: 'Test Network 1' },
        { id: 2, name: 'Test Network 2' },
      ],
      stateAbbrs: ['State 1', 'State 2'],
      payerGroup: {
        name: 'payer group 1',
        payerGroupId: '1',
      },
      link: '/payers/1',
      createdAt: '2023-02-20T13:58:02.309Z',
      updatedAt: '2023-02-20T13:58:02.309Z',
      notes: 'Note 1',
    },
    {
      id: 2,
      name: 'Test payer2',
      insuranceNetworks: [
        { id: 1, name: 'Test Network 1' },
        { id: 2, name: 'Test Network 2' },
      ],
      stateAbbrs: ['State 1', 'State 2'],
      payerGroup: {
        name: 'payer group 2',
        payerGroupId: '2',
      },
      link: '/payers/2',
      createdAt: '2023-02-20T13:58:02.309Z',
      updatedAt: '2023-02-20T13:58:02.309Z',
      notes: 'Note 2',
    },
  ],
};

const mockedElementDimensions: DOMRect = {
  x: 0,
  y: 0,
  width: 200,
  height: 50,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
  toJSON: vi.fn(),
};

const setup = (overrideProps: Partial<PayersTableProps> = {}) => {
  const getRowsCountSelect = () =>
    screen.getByRole('button', { expanded: false });
  const findRowsCountOptions = () => screen.findAllByRole('option');
  const getPaginationPrevButton = () =>
    screen.getByTitle<HTMLButtonElement>(/Go to previous page/);
  const getPaginationNextButton = () =>
    screen.getByTitle<HTMLButtonElement>(/Go to next page/);
  const getSortByNameLabel = () =>
    screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER_SORT_BY_NAME_LABEL
    );
  const getSortByUpdatedAtLabel = () =>
    screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER_SORT_BY_UPDATED_AT_LABEL
    );
  const findPayerGroupCell = (payerId: number) =>
    screen.findByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowGroupCellTestId(payerId)
    );

  return {
    ...render(
      <PayersTable {...{ ...mockedProps, ...overrideProps }} />,
      {},
      undefined,
      true
    ),
    getRowsCountSelect,
    findRowsCountOptions,
    getPaginationPrevButton,
    getPaginationNextButton,
    getSortByNameLabel,
    getSortByUpdatedAtLabel,
    findPayerGroupCell,
  };
};

describe('<PayersTable />', () => {
  it('should render properly', () => {
    setup();
    const tableRoot = screen.getByTestId(PAYERS_TABLE_TEST_IDS.TABLE_ROOT);
    expect(tableRoot).toBeVisible();

    const tableHeaderCellTestIds = [
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER,
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER_SORT_BY_NAME_LABEL,
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_NETWORKS,
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_STATES,
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_LAST_UPDATED,
      PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER_SORT_BY_UPDATED_AT_LABEL,
    ];

    tableHeaderCellTestIds.forEach((headerCellTestId) => {
      const headerCell = screen.getByTestId(headerCellTestId);
      expect(headerCell).toBeVisible();
    });

    expect(
      screen.getByTestId(PAYERS_TABLE_TEST_IDS.TABLE_HEADER_CELL_PAYER)
    ).toHaveAttribute('aria-sort', 'ascending');

    const payers = mockedProps.payers;

    payers.forEach((payer) => {
      const tableRow = screen.getByTestId(
        PAYERS_TABLE_TEST_IDS.getPayerRowTestId(payer.id)
      );
      expect(tableRow).toBeVisible();

      const { getByTestId: withinRowGetByTestId } = within(tableRow);

      const networkCellTestId =
        PAYERS_TABLE_TEST_IDS.getPayerRowNetworkCellTestId(payer.id);
      const networkCell = withinRowGetByTestId(networkCellTestId);
      expect(networkCell).toBeVisible();

      const stateCellTestId = PAYERS_TABLE_TEST_IDS.getPayerRowStateCellTestId(
        payer.id
      );
      const stateCell = withinRowGetByTestId(stateCellTestId);
      expect(stateCell).toBeVisible();

      const groupCellTestId = PAYERS_TABLE_TEST_IDS.getPayerRowGroupCellTestId(
        payer.id
      );
      const groupCell = withinRowGetByTestId(groupCellTestId);
      expect(groupCell).toBeVisible();

      const lastUpdatedCellTestId =
        PAYERS_TABLE_TEST_IDS.getPayerRowLastUpdatedCellTestId(payer.id);
      const lastUpdatedCell = withinRowGetByTestId(lastUpdatedCellTestId);
      expect(lastUpdatedCell).toBeVisible();

      const expandCellTestId =
        PAYERS_TABLE_TEST_IDS.getPayerRowExpandCellTestId(payer.id);
      const expandCell = withinRowGetByTestId(expandCellTestId);
      expect(expandCell).toBeVisible();

      const collapsedTestId = PAYERS_TABLE_TEST_IDS.getPayerRowCollapsedTestId(
        payer.id
      );
      const collapsed = withinRowGetByTestId(collapsedTestId);
      expect(collapsed).toBeVisible();
    });
  });

  it('should show payer group name tooltip when the payer group name is truncated with ellipses', async () => {
    HTMLDivElement.prototype.getBoundingClientRect = vi.fn(() => ({
      ...mockedElementDimensions,
      width: mockedElementDimensions.width - 1,
    }));
    HTMLSpanElement.prototype.getBoundingClientRect = vi.fn(
      () => mockedElementDimensions
    );

    const { user, findPayerGroupCell } = setup();

    const payerGroupCell = await findPayerGroupCell(mockedProps.payers[0].id);
    expect(payerGroupCell).toBeVisible();
    expect(payerGroupCell).toHaveTextContent(
      mockedProps.payers[0].payerGroup.name
    );

    const payerGroupName = within(payerGroupCell).getByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowGroupCellPayerGroupNameTestId(
        mockedProps.payers[0].id
      )
    );

    await user.hover(payerGroupName);

    const tooltip = await screen.findByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowGroupCellTooltipTestId(
        mockedProps.payers[0].id
      )
    );
    expect(tooltip).toBeVisible();
    expect(tooltip).toHaveTextContent(mockedProps.payers[0].payerGroup.name);
  });

  it('should not show payer group name tooltip when the payer group name is not truncated with ellipses', async () => {
    HTMLDivElement.prototype.getBoundingClientRect = vi.fn(
      () => mockedElementDimensions
    );
    HTMLSpanElement.prototype.getBoundingClientRect = vi.fn(() => ({
      ...mockedElementDimensions,
      width: mockedElementDimensions.width - 1,
    }));

    const { user, findPayerGroupCell } = setup();

    const payerGroupCell = await findPayerGroupCell(mockedProps.payers[0].id);
    expect(payerGroupCell).toBeVisible();
    expect(payerGroupCell).toHaveTextContent(
      mockedProps.payers[0].payerGroup.name
    );

    const payerGroupName = within(payerGroupCell).getByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowGroupCellPayerGroupNameTestId(
        mockedProps.payers[0].id
      )
    );

    await user.hover(payerGroupName);

    const tooltip = screen.queryByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowGroupCellTooltipTestId(
        mockedProps.payers[0].id
      )
    );
    expect(tooltip).not.toBeInTheDocument();
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

  it('should change number of rows per page', async () => {
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

    expect(prevButton.disabled).toEqual(true);
    expect(nextButton.disabled).toBeFalsy();

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

  it('should change sort direction when pressed on payer name header label', async () => {
    const { getSortByNameLabel, user } = setup({
      sortField: PayersSortFields.NAME,
      sortOrder: PayersSortDirection.ASC,
    });

    const sortLabel = getSortByNameLabel();
    await user.click(sortLabel);

    expect(mockedProps.onChangeSortOrder).toBeCalledWith(
      PayersSortFields.NAME,
      PayersSortDirection.DESC
    );
  });

  it('should change sort direction when pressed on Last Updated header label', async () => {
    const { getSortByUpdatedAtLabel, user } = setup({
      sortField: PayersSortFields.UPDATED_AT,
      sortOrder: PayersSortDirection.ASC,
    });

    const sortLabel = getSortByUpdatedAtLabel();
    await user.click(sortLabel);

    expect(mockedProps.onChangeSortOrder).toBeCalledWith(
      PayersSortFields.UPDATED_AT,
      PayersSortDirection.DESC
    );
  });

  it('should expand table card by clicking on it', async () => {
    const { user } = setup();

    const tableRoot = screen.getByTestId(PAYERS_TABLE_TEST_IDS.TABLE_ROOT);
    expect(tableRoot).toBeVisible();

    const payer = mockedProps.payers[0];
    const tableRow = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowTestId(payer.id)
    );
    expect(tableRow).toBeVisible();
    expect(
      screen.getByTestId(
        PAYERS_TABLE_TEST_IDS.getPayerRowCollapsedTestId(payer.id)
      )
    ).toBeVisible();

    await user.click(tableRow);

    expect(
      await screen.findByTestId(
        PAYERS_TABLE_TEST_IDS.getPayerRowExpandedTestId(payer.id)
      )
    ).toBeVisible();
  });

  it('should render expanded row', async () => {
    const { user } = setup();

    const payer = mockedProps.payers[0];

    const tableRow = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowTestId(payer.id)
    );
    expect(tableRow).toBeVisible();

    const { getByTestId: withinRowGetByTestId } = within(tableRow);

    await user.click(tableRow);
    payer.insuranceNetworks.forEach((network) => {
      const networkEl = withinRowGetByTestId(
        PAYERS_TABLE_TEST_IDS.getPayerRowNetworkCellValueTestId(
          payer.id,
          network.id
        )
      );
      expect(networkEl).toBeVisible();
      expect(networkEl).toHaveTextContent(network.name);
    });

    payer.stateAbbrs.forEach((state) => {
      const stateEl = withinRowGetByTestId(
        PAYERS_TABLE_TEST_IDS.getPayerRowStateCellValueTestId(payer.id, state)
      );
      expect(stateEl).toBeVisible();
      expect(stateEl).toHaveTextContent(state);
    });
  });

  it('should show hidden items count for collapsed table card', async () => {
    const { user } = setup();

    const tableRoot = screen.getByTestId(PAYERS_TABLE_TEST_IDS.TABLE_ROOT);
    expect(tableRoot).toBeVisible();

    const payer = mockedProps.payers[0];
    const tableRow = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowTestId(payer.id)
    );
    expect(tableRow).toBeVisible();

    const collapsedRowIcon = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowCollapsedTestId(payer.id)
    );
    expect(collapsedRowIcon).toBeVisible();

    const networkCellCollapsedCounter = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowCollapsedCounterChipsTestId(
        payer.id,
        'networks'
      )
    );
    expect(networkCellCollapsedCounter).toBeVisible();
    expect(networkCellCollapsedCounter).toHaveTextContent('+1');

    await user.click(tableRow);

    const expandedRowIcon = await screen.findByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowExpandedTestId(payer.id)
    );
    expect(expandedRowIcon).toBeVisible();
    expect(networkCellCollapsedCounter).not.toBeInTheDocument();
  });

  it('should condense table card by clicking on it again', async () => {
    const { user } = setup();

    const tableRoot = screen.getByTestId(PAYERS_TABLE_TEST_IDS.TABLE_ROOT);
    expect(tableRoot).toBeVisible();

    const payer = mockedProps.payers[0];
    const tableRow = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowTestId(payer.id)
    );
    expect(tableRow).toBeVisible();
    expect(
      screen.getByTestId(
        PAYERS_TABLE_TEST_IDS.getPayerRowCollapsedTestId(payer.id)
      )
    ).toBeVisible();

    await user.click(tableRow);

    expect(
      await screen.findByTestId(
        PAYERS_TABLE_TEST_IDS.getPayerRowExpandedTestId(payer.id)
      )
    ).toBeVisible();

    await user.click(tableRow);

    expect(
      await screen.findByTestId(
        PAYERS_TABLE_TEST_IDS.getPayerRowCollapsedTestId(payer.id)
      )
    ).toBeVisible();
  });

  it('should collapse first expanded card after expanding second card', async () => {
    const { user } = setup();

    const tableRoot = screen.getByTestId(PAYERS_TABLE_TEST_IDS.TABLE_ROOT);
    expect(tableRoot).toBeVisible();

    const payer = mockedProps.payers[0];
    const tableRow = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowTestId(payer.id)
    );
    expect(tableRow).toBeVisible();
    expect(
      screen.getByTestId(
        PAYERS_TABLE_TEST_IDS.getPayerRowCollapsedTestId(payer.id)
      )
    ).toBeVisible();

    await user.click(tableRow);

    expect(
      await screen.findByTestId(
        PAYERS_TABLE_TEST_IDS.getPayerRowExpandedTestId(payer.id)
      )
    ).toBeVisible();

    const secondPayer = mockedProps.payers[1];
    const secondTableRow = screen.getByTestId(
      PAYERS_TABLE_TEST_IDS.getPayerRowTestId(secondPayer.id)
    );

    await user.click(secondTableRow);

    expect(
      await screen.findByTestId(
        PAYERS_TABLE_TEST_IDS.getPayerRowCollapsedTestId(payer.id)
      )
    ).toBeVisible();
    expect(
      screen.getByTestId(
        PAYERS_TABLE_TEST_IDS.getPayerRowExpandedTestId(secondPayer.id)
      )
    ).toBeVisible();
  });
});

describe('isTruncated util', () => {
  it.each([
    {
      title: 'greater than',
      contentWidth: 200,
      containerWidth: 150,
      expected: true,
    },
    {
      title: 'less than',
      contentWidth: 150,
      containerWidth: 200,
      expected: false,
    },
    {
      title: 'equal to',
      contentWidth: 200,
      containerWidth: 200,
      expected: false,
    },
  ])(
    'should return correct boolean result if content width is $title container width',
    ({ contentWidth, containerWidth, expected }) => {
      const result = isTruncated(contentWidth, containerWidth);
      expect(result).toEqual(expected);
    }
  );
});
