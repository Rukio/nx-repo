import React, { ReactNode, useCallback, useMemo } from 'react';
import {
  Button,
  Chip,
  FormGroup,
  FormLabel,
  Grid,
  Menu,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { Search } from '../Search';
import {
  FilterCheckbox,
  createFilterLabelFromSelectedItems,
  sortItems,
} from './FilterUtils';

interface Props {
  children?: ReactNode;
  testid?: string;
  defaultLabel: string;
  items?: { name: string; id: string }[];
  selectedIds: string[];
  setSelectedIds: (_: string[]) => void;
  customLabel?: string;
  isSearchable?: boolean;
}

const styles = makeSxStyles({
  doneButton: { marginRight: '12px', marginBottom: '12px' },
  selectAllButton: { marginLeft: '12px', marginBottom: '12px' },
  clearButton: {
    marginLeft: '6px',
    marginRight: '24px',
    marginBottom: '12px',
  },
  formGroup: {
    padding: '0 12px',
    marginBottom: '10px',
    marginRight: '12px',
    maxHeight: '400px',
    overflowY: 'auto',
    display: 'grid',
    '&::-webkit-scrollbar': {
      width: '8px',
    },
    '&::-webkit-scrollbar-track': {
      backgroundColor: 'white',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: 'rgba(38, 38, 38, 0.5)',
      borderRadius: 3.5,
    },
  },
  formLabel: {
    paddingX: '4px',
    paddingY: '12px',
    fontSize: '14px',
    fontWeight: '600',
    letterSpacing: '0.25px',
    color: (theme) => theme.palette.text.secondary,
  },
  menu: {
    '& .MuiList-root': { margin: '16px 0 0 12px', borderRadius: '8px' },
  },
  search: {
    display: 'block',
    marginLeft: '4px',
    marginRight: '16px',
    marginY: '4px',
    width: '95%',
    borderRadius: '8px',
  },
});

export const Filter: React.FC<Props> = React.memo(
  ({
    items = [],
    children,
    testid,
    defaultLabel,
    selectedIds,
    setSelectedIds,
    customLabel,
    isSearchable,
  }) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [searchTerm, setSearchTerm] = React.useState('');
    const loweredCaseTerm = searchTerm.toLowerCase();

    const open = Boolean(anchorEl);

    const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    }, []);

    const handleClose = useCallback(() => {
      setAnchorEl(null);
      setSearchTerm('');
    }, []);

    const handleClear = useCallback(() => {
      setSelectedIds([]);
    }, [setSelectedIds]);

    const sortedItems = useMemo(() => sortItems(items) || [], [items]);
    const sortedSelectedItems = useMemo(
      () => sortedItems.filter(({ id }) => selectedIds.includes(id)),
      [selectedIds, sortedItems]
    );

    const createLabel = useCallback(() => {
      return (
        customLabel ?? createFilterLabelFromSelectedItems(sortedSelectedItems)
      );
    }, [customLabel, sortedSelectedItems]);
    const isEmpty = sortedSelectedItems.length === 0;
    const handleFilterItems = ({ longName }: { longName: string }) => {
      if (!searchTerm) {
        return true;
      } else {
        return longName.toLowerCase().includes(loweredCaseTerm);
      }
    };

    return (
      <>
        <Chip
          data-testid={`${testid}-filter`}
          variant="outlined"
          color={isEmpty ? 'default' : 'primary'}
          label={isEmpty ? defaultLabel : createLabel()}
          onClick={handleClick}
          onDelete={handleClear}
        />
        <Menu
          sx={styles.menu}
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
        >
          <FormLabel sx={styles.formLabel} data-testid={`${testid}-label-text`}>
            {defaultLabel}
          </FormLabel>
          {isSearchable && (
            <Search
              testId={`${testid}-search-input`}
              value={searchTerm}
              placeholder="Search"
              onChange={setSearchTerm}
              sx={styles.search}
            />
          )}
          <FormGroup
            sx={styles.formGroup}
            data-testid={`${testid}-dropdown-list`}
          >
            {children ??
              sortedItems
                .filter(handleFilterItems)
                .map((filter) => (
                  <FilterCheckbox
                    key={filter.id}
                    filter={filter}
                    setSelectedItems={setSelectedIds}
                    selectedItems={selectedIds}
                  />
                ))}
          </FormGroup>
          <Grid container direction="row" justifyContent="space-between">
            <Button
              onClick={handleClear}
              data-testid="clear-filter-button"
              sx={styles.clearButton}
            >
              Clear and Show All
            </Button>
            <Button
              onClick={handleClose}
              variant="contained"
              data-testid="done-filter-button"
              sx={styles.doneButton}
            >
              Done
            </Button>
          </Grid>
        </Menu>
      </>
    );
  }
);
