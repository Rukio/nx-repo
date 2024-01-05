import { useState, MouseEvent, ChangeEventHandler } from 'react';
import {
  TextField,
  Grid,
  Typography,
  SearchIcon,
  Menu,
  MenuItem,
  Chip,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { INSURANCE_FILTERS_TESTS_IDS } from './testIds';

type FilterOption = { id: number; name: string };

type Props = {
  filterOptions: FilterOption[];
  filterBy?: FilterOption;
  onFilterByChange: (value?: FilterOption) => void;
  searchText: string;
  onChangeSearch: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  disableFilter?: boolean;
};

const makeStyles = () =>
  makeSxStyles({
    filtersRoot: {
      mt: 3,
    },
    filterByRoot: {
      display: 'flex',
      alignItems: 'center',
    },
    filterByLabel: {
      color: 'text.secondary',
      mr: 2,
    },
  });

const InsuranceFilters = ({
  filterOptions = [],
  filterBy,
  onFilterByChange,
  searchText,
  onChangeSearch,
  disableFilter,
}: Props) => {
  const classes = makeStyles();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) =>
    setMenuAnchorEl(event.currentTarget);

  const handleCloseMenu = () => setMenuAnchorEl(null);

  const onChangeFilter = (value: FilterOption) => () => {
    const isActiveFilterClicked = filterBy?.id === value.id;
    onFilterByChange(isActiveFilterClicked ? undefined : value);
    handleCloseMenu();
  };

  return (
    <Grid container sx={classes.filtersRoot} spacing={3}>
      <Grid item xs={6.5}>
        <TextField
          InputProps={{ startAdornment: <SearchIcon /> }}
          placeholder="Search by insurance plan name or Athena package ID"
          fullWidth
          defaultValue={searchText}
          onChange={onChangeSearch}
          inputProps={{
            'data-testid': INSURANCE_FILTERS_TESTS_IDS.SEARCH_FIELD,
          }}
        />
      </Grid>
      <Grid item sx={classes.filterByRoot}>
        <Typography variant="body2" sx={classes.filterByLabel}>
          Filter by
        </Typography>
        <Chip
          label={filterBy?.name ?? 'Select Filter'}
          variant="outlined"
          clickable
          onClick={handleOpenMenu}
          data-testid={INSURANCE_FILTERS_TESTS_IDS.FILTER_BY_SELECT}
          disabled={disableFilter}
        />
        <Menu
          open={Boolean(menuAnchorEl)}
          anchorEl={menuAnchorEl}
          onClose={handleCloseMenu}
        >
          {filterOptions.map((option) => (
            <MenuItem
              onClick={onChangeFilter(option)}
              key={`filter-by-${option.id}`}
              data-testid={INSURANCE_FILTERS_TESTS_IDS.getFilterByOptionTestId(
                option.id
              )}
              selected={option.id === filterBy?.id}
            >
              {option.name}
            </MenuItem>
          ))}
        </Menu>
      </Grid>
    </Grid>
  );
};

export default InsuranceFilters;
