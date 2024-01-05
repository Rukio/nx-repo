import { FC } from 'react';
import { Grid, Typography, makeSxStyles } from '@*company-data-covered*/design-system';
import { NETWORK_FILTERS_TESTS_IDS } from './testIds';
import { FilterMenu, FilterOption } from '../FilterMenu';
import { FILTER_MENU_TESTS_IDS } from '../FilterMenu/testIds';

export type NetworksFiltersProps = {
  filters: FilterOption[];
  onFilterByChange: (filter: FilterOption, value?: string) => void;
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

const NetworksFilters: FC<NetworksFiltersProps> = ({
  filters,
  onFilterByChange,
  onChangeFilterOptionSearch,
  onClearFilterOptions,
  onSelectFilterOptions,
}) => {
  const classes = makeStyles();

  return (
    <Grid
      container
      spacing={3}
      width="auto"
      data-testid={NETWORK_FILTERS_TESTS_IDS.FILTER_ROOT}
    >
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

export default NetworksFilters;
