import { visuallyHidden } from '@mui/utils';
import { FC } from 'react';
import {
  Box,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

export type CellAlign =
  | 'right'
  | 'left'
  | 'inherit'
  | 'center'
  | 'justify'
  | undefined;

export interface HeadCell {
  id: string;
  label: string;
  sortable: boolean;
  align: CellAlign;
}

const styles = makeSxStyles({
  noBorder: { border: 'none' },
});

type SortableTableHeaderProps = {
  headCells: readonly HeadCell[];
  onSortChange: (sortBy: string) => void;
  orderBy: string;
  order: 'asc' | 'desc';
};

export const SortableTableHeader: FC<SortableTableHeaderProps> = ({
  headCells,
  onSortChange,
  orderBy,
  order,
}) => (
  <TableHead data-testid="sortable-table-header">
    <TableRow>
      {headCells.map((headCell) =>
        headCell.sortable ? (
          <TableCell
            key={headCell.id}
            align={headCell.align}
            sortDirection={orderBy === headCell.id ? order : false}
            data-testid={`${headCell.id}-header-cell`}
            sx={styles.noBorder}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'desc'}
              onClick={() => onSortChange(headCell.id)}
              data-testid={`${headCell.id}-cell-label`}
            >
              {headCell.label}
              {headCell.sortable && orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ) : (
          <TableCell
            key={headCell.id}
            align={headCell.align}
            data-testid={`${headCell.id}-nonsort-header-cell`}
            sx={styles.noBorder}
          >
            {headCell.label}
          </TableCell>
        )
      )}
    </TableRow>
  </TableHead>
);
