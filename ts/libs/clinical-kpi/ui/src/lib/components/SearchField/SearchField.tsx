import { ChangeEvent } from 'react';
import {
  TextField,
  SearchIcon,
  makeSxStyles,
  theme,
} from '@*company-data-covered*/design-system';
import { useDebouncedCallback } from '@*company-data-covered*/shared/util/hooks';
import { SEARCH_FIELD_TEST_IDS } from './testIds';

export type SearchFieldProps = {
  value?: string;
  onChange: (value: string) => void;
  debounceDelayMs?: number;
};

const makeStyles = () =>
  makeSxStyles({
    textField: {
      backgroundColor: 'grey.100',
      padding: 1.5,
      '& fieldset': { border: 'none' },
    },
    searchIcon: {
      color: 'text.secondary',
    },
  });

const SearchField = ({
  value,
  onChange,
  debounceDelayMs,
}: SearchFieldProps) => {
  const styles = makeStyles();

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) =>
    onChange(e.target.value);

  const debouncedSearchChangeHandler = useDebouncedCallback(
    handleOnChange,
    debounceDelayMs
  );

  return (
    <TextField
      data-testid={SEARCH_FIELD_TEST_IDS.ROOT}
      placeholder="Search"
      onChange={debounceDelayMs ? debouncedSearchChangeHandler : handleOnChange}
      sx={styles.textField}
      value={value}
      InputProps={{
        startAdornment: <SearchIcon sx={styles.searchIcon} />,
      }}
      inputProps={{
        style: {
          padding: 0,
          marginLeft: theme.spacing(1),
        },
        'data-testid': SEARCH_FIELD_TEST_IDS.INPUT,
      }}
    />
  );
};

export default SearchField;
