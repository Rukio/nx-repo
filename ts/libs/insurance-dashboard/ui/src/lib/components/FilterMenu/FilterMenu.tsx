import {
  FC,
  useState,
  MouseEvent,
  ChangeEventHandler,
  KeyboardEventHandler,
} from 'react';
import {
  TextField,
  Grid,
  Box,
  Typography,
  SearchIcon,
  Menu,
  FormControlLabel,
  Chip,
  Checkbox,
  MenuItem,
  Button,
  makeSxStyles,
} from '@*company-data-covered*/design-system';
import { FILTER_MENU_TESTS_IDS } from './testIds';
import { MAX_CHIPS_LABEL_LENGTH } from '../../constants';

export enum FilterOptionTitle {
  STATE = 'State',
}

export enum FilterOptionHeaderTitle {
  STATES = 'States',
}

export type FilterOptionItem = {
  id: number | string;
  name: string;
};

export type FilterOption = {
  title: string;
  optionsTitle: string;
  options: FilterOptionItem[];
  filteredOptions: FilterOptionItem[];
  searchText: string;
  filterBy: string[];
  disableFilter?: boolean;
};

export type FilterMenuProps = {
  filter: FilterOption;
  onFilterByChange: (filter: FilterOption, value?: string) => void;
  onChangeFilterOptionSearch: (filter: FilterOption, value: string) => void;
  onClearFilterOptions: (filter: FilterOption) => void;
  onSelectFilterOptions: (filter: FilterOption) => void;
};

const makeStyles = () =>
  makeSxStyles({
    textInputRoot: (theme) => ({ background: theme.palette.grey[100] }),
    filterOptionsMenuButtonsRoot: {
      position: 'sticky',
      zIndex: 1,
      bottom: 0,
      py: 1,
      px: 1.5,
      justifyContent: 'space-between',
      backgroundColor: (theme) => ({ background: theme.palette.common.white }),
    },
    filterRoot: { mr: 1 },
    filterHeader: {
      mt: 1,
      mx: 1.5,
    },
    filterOptionLabel: {
      color: 'text.secondary',
      pb: 1,
    },
    formControlLabel: {
      width: '100%',
      mx: 0,
      pl: 0.75,
    },
    menuItem: {
      pl: 0,
      pr: 0.75,
      py: 0,
    },
    menuInnerPaper: {
      mt: 1,
      minWidth: 264,
      width: 'min-content',
      maxHeight: 364,
    },
    filterOptionsWrapper: { pt: 1 },
  });

const FilterMenu: FC<FilterMenuProps> = ({
  filter,
  onFilterByChange,
  onChangeFilterOptionSearch,
  onClearFilterOptions,
  onSelectFilterOptions,
}) => {
  const classes = makeStyles();
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const filterByLength = filter.filterBy.length;
  const filterOptionTestId = (title: string, optionId: number | string) =>
    FILTER_MENU_TESTS_IDS.getFilterOptionTestId(title, optionId);

  const handleOpenMenu = (event: MouseEvent<HTMLElement>) =>
    setMenuAnchorEl(event.currentTarget);

  const handleCloseMenu = () => {
    onSelectFilterOptions(filter);
    setMenuAnchorEl(null);
  };

  const onSearch: ChangeEventHandler<HTMLTextAreaElement | HTMLInputElement> = (
    event
  ) => {
    onChangeFilterOptionSearch(filter, event.target.value);
  };

  const onSearchFieldKeyDown: KeyboardEventHandler<HTMLInputElement> = (
    event
  ) => {
    event.stopPropagation();
  };

  const onChangeFilter = (value: FilterOptionItem) => () => {
    onFilterByChange(filter, value.id.toString());
  };

  const onFilterOptionSelected = () => {
    onSelectFilterOptions(filter);
    handleCloseMenu();
  };

  const onFilterOptionReset = () => {
    onClearFilterOptions(filter);
    setMenuAnchorEl(null);
  };

  const isSelected = (filterOptionId: number | string) =>
    !!filter.filterBy.find((option) => filterOptionId.toString() === option);

  const getChipLabel = () => {
    if (filterByLength) {
      const selectedFiltersString = filter.options
        .filter((option) => filter.filterBy.includes(option.id.toString()))
        .map((option) => option.name)
        .join(', ');

      return selectedFiltersString.length > MAX_CHIPS_LABEL_LENGTH
        ? `${selectedFiltersString.slice(0, MAX_CHIPS_LABEL_LENGTH)}...`
        : selectedFiltersString;
    }

    return filter.title;
  };

  return (
    <Grid sx={classes.filterRoot}>
      <Chip
        color={filterByLength ? 'primary' : 'default'}
        label={getChipLabel()}
        variant="outlined"
        clickable
        onClick={handleOpenMenu}
        data-testid={FILTER_MENU_TESTS_IDS.getFilterChipsTestId(filter.title)}
        disabled={filter.disableFilter}
        onDelete={filterByLength ? onFilterOptionReset : undefined}
      />
      <Menu
        open={Boolean(menuAnchorEl)}
        anchorEl={menuAnchorEl}
        data-testid={FILTER_MENU_TESTS_IDS.getFilterChipsMenuTestId(
          filter.title
        )}
        MenuListProps={{
          disablePadding: true,
        }}
        PaperProps={{
          sx: classes.menuInnerPaper,
        }}
        onClose={handleCloseMenu}
        transitionDuration={0}
      >
        <Box sx={classes.filterHeader}>
          <Typography sx={classes.filterOptionLabel} variant="subtitle2">
            {filter.optionsTitle}
          </Typography>
          <TextField
            sx={classes.textInputRoot}
            size="small"
            InputProps={{ startAdornment: <SearchIcon /> }}
            placeholder="Search"
            fullWidth
            value={filter.searchText}
            onChange={onSearch}
            onKeyDown={onSearchFieldKeyDown}
            inputProps={{
              'data-testid': FILTER_MENU_TESTS_IDS.FILTER_OPTION_SEARCH_FIELD,
            }}
          />
        </Box>
        <Box sx={classes.filterOptionsWrapper}>
          {filter.filteredOptions.map((option) => {
            const filterMenuItemTestId =
              FILTER_MENU_TESTS_IDS.getFilterMenuItemTestid(
                filter.title,
                option.id
              );

            return (
              <MenuItem
                key={filterMenuItemTestId}
                data-testid={filterMenuItemTestId}
                sx={classes.menuItem}
              >
                <FormControlLabel
                  sx={classes.formControlLabel}
                  control={
                    <Checkbox
                      checked={isSelected(option.id)}
                      onChange={onChangeFilter(option)}
                      data-testid={filterOptionTestId(filter.title, option.id)}
                    />
                  }
                  label={option.name}
                />
              </MenuItem>
            );
          })}
        </Box>
        <Grid container sx={classes.filterOptionsMenuButtonsRoot}>
          <Button
            data-testid={FILTER_MENU_TESTS_IDS.FILTER_CLEAR_BUTTON}
            onClick={onFilterOptionReset}
          >
            Clear
          </Button>
          <Button
            variant="contained"
            data-testid={FILTER_MENU_TESTS_IDS.FILTER_DONE_BUTTON}
            onClick={onFilterOptionSelected}
          >
            Done
          </Button>
        </Grid>
      </Menu>
    </Grid>
  );
};

export default FilterMenu;
