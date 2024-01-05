import { renderWithClient } from '@*company-data-covered*/caremanager/utils-react';
import { fireEvent, screen } from '@testing-library/react';
import { HeadCell, SortableTableHeader } from '../SortableTableHeader';

const onSort = vi.fn();
const headCellsData: readonly HeadCell[] = [
  {
    id: 'column1',
    label: 'Sortable Column',
    sortable: true,
    align: 'left',
  },
  {
    id: 'column2',
    label: 'Non-Sortable Column',
    sortable: false,
    align: 'center',
  },
];

const setup = (
  headCells: readonly HeadCell[],
  props: { order: 'asc' | 'desc' } = { order: 'asc' }
) => {
  const { order } = props;
  renderWithClient(
    <SortableTableHeader
      headCells={headCells}
      onSortChange={onSort}
      order={order}
      orderBy={headCellsData[0].id}
    />
  );
};

describe('SortableTableHeader', () => {
  it('should render correctly', () => {
    setup(headCellsData);
    expect(screen.getByTestId('sortable-table-header')).toBeInTheDocument();
  });

  it('should render sortable and non-sortable cells', () => {
    setup(headCellsData);
    expect(
      screen.getByTestId(`${headCellsData[0].id}-header-cell`)
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(`${headCellsData[1].id}-nonsort-header-cell`)
    ).toBeInTheDocument();
  });

  it('should render ascending sort direction by default', () => {
    setup(headCellsData);
    expect(
      screen.getByTestId(`${headCellsData[0].id}-header-cell`)
    ).toHaveAttribute('aria-sort', 'ascending');
  });

  it('should render descending sort direction', () => {
    setup(headCellsData, { order: 'desc' });
    expect(
      screen.getByTestId(`${headCellsData[0].id}-header-cell`)
    ).toHaveAttribute('aria-sort', 'descending');
  });

  it('should call onSort on click', () => {
    setup(headCellsData);
    const sortCell = screen.getByTestId(`${headCellsData[0].id}-header-cell`);
    expect(sortCell).toHaveAttribute('aria-sort', 'ascending');
    const sortCellLabel = screen.getByTestId(
      `${headCellsData[0].id}-cell-label`
    );
    fireEvent.click(sortCellLabel);
    expect(onSort).toHaveBeenCalled();
  });

  it('should not render sortable cells if no sortable cells are provided', () => {
    const nonSorCells: readonly HeadCell[] = [
      {
        id: 'column1',
        label: 'Sortable Column',
        sortable: false,
        align: 'left',
      },
      {
        id: 'column2',
        label: 'Non-Sortable Column',
        sortable: false,
        align: 'center',
      },
    ];
    setup(nonSorCells);
    expect(
      screen.queryByTestId(`${headCellsData[0].id}-cell-label`)
    ).not.toBeInTheDocument();
  });
});
