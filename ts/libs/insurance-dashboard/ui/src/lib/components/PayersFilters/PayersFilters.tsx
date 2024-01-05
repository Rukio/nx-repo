import { FC, ChangeEventHandler } from 'react';
import {
  TextField,
  Grid,
  Typography,
  SearchIcon,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { PAYERS_FILTERS_TESTS_IDS } from './testIds';
import { FilterMenu, FilterOption } from '../FilterMenu';
import { FILTER_MENU_TESTS_IDS } from '../FilterMenu/testIds';

export type PayersFiltersProps = {
  searchText?: string;
  filters: FilterOption[];
  onFilterByChange: (filter: FilterOption, value?: string) => void;
  onChangeSearch: (value: string) => void;
  onChangeFilterOptionSearch: (filter: FilterOption, value: string) => void;
  onClearFilterOptions: (filter: FilterOption) => void;
  onSelectFilterOptions: (filter: FilterOption) => void;
};

const makeStyles = () =>
  makeSxStyles({
    textInputRoot: (theme) => ({ background: theme.palette.grey[100] }),
    filtersContainer: {
      display: 'flex',
      alignItems: 'center',
    },
    filterByLabel: {
      color: 'text.secondary',
      mr: 2,
    },
  });

const PayersFilters: FC<PayersFiltersProps> = ({
  searchText = '',
  filters,
  onFilterByChange,
  onChangeSearch,
  onChangeFilterOptionSearch,
  onClearFilterOptions,
  onSelectFilterOptions,
}) => {
  const classes = makeStyles();

  const onSearch: ChangeEventHandler<HTMLInputElement> = (event) => {
    onChangeSearch(event.target.value);
  };

  return (
    <Grid
      container
      spacing={3}
      data-testid={PAYERS_FILTERS_TESTS_IDS.FILTER_ROOT}
    >
      <Grid item xs={3}>
        <TextField
          sx={classes.textInputRoot}
          size="small"
          InputProps={{ startAdornment: <SearchIcon /> }}
          placeholder="Search for a insurance payer"
          fullWidth
          value={searchText}
          onChange={onSearch}
          data-testid={PAYERS_FILTERS_TESTS_IDS.FILTER_SEARCH_FIELD}
          inputProps={{
            'data-testid': PAYERS_FILTERS_TESTS_IDS.FILTER_SEARCH_FIELD_INPUT,
          }}
        />
      </Grid>
      <Grid item sx={classes.filtersContainer}>
        <Typography variant="body2" sx={classes.filterByLabel}>
          Filter by
        </Typography>
        {filters.map((filter) => (
          <FilterMenu
            key={FILTER_MENU_TESTS_IDS.getFilterChipsTestId(filter.title)}
            filter={filter}
            onFilterByChange={onFilterByChange}
            onChangeFilterOptionSearch={onChangeFilterOptionSearch}
            onClearFilterOptions={onClearFilterOptions}
            onSelectFilterOptions={onSelectFilterOptions}
          />
        ))}
      </Grid>
    </Grid>
  );
};

export default PayersFilters;
