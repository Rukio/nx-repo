import React from 'react';
import {
  BoxProps,
  CloseIcon,
  InputAdornment,
  SearchIcon,
  TextField,
  TextFieldProps,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  textField: {
    backgroundColor: 'grey.A200',
    '& .MuiOutlinedInput-notchedOutline': {
      border: 0,
    },
  },
  closeButton: {
    cursor: 'pointer',
  },
});

interface SearchProps extends Omit<BoxProps, 'value' | 'onChange'> {
  onChange?: (value: string) => void;
  onClick?: TextFieldProps['onClick'];
  value: string;
  placeholder: string;
  testId: string;
  inputTestid?: string;
  autoFocus?: boolean;
}

export const Search: React.FC<SearchProps> = React.memo(
  ({
    onChange,
    onClick,
    value,
    placeholder,
    testId,
    inputTestid = 'search-input',
    autoFocus = true,
    sx,
  }) => (
    <TextField
      placeholder={placeholder}
      data-testid={testId}
      id="search-input-id"
      size="small"
      sx={{
        ...styles.textField,
        ...sx,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon />
          </InputAdornment>
        ),
        inputProps: {
          'data-testid': inputTestid,
        },
        endAdornment: (
          <InputAdornment
            position="end"
            onClick={() => onChange && onChange('')}
            sx={styles.closeButton}
            data-testid="clear-button"
          >
            <CloseIcon />
          </InputAdornment>
        ),
      }}
      onChange={(event) => onChange && onChange(event.target.value)}
      onClick={(event) => onClick && onClick(event)}
      value={value}
      hiddenLabel
      fullWidth
      autoFocus={autoFocus}
    />
  )
);
