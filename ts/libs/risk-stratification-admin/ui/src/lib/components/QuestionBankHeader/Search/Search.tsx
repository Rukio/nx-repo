import {
  Box,
  InputBase,
  makeSxStyles,
  SearchIcon,
} from '@*company-data-covered*/design-system';
import { FC } from 'react';
import { QUESTION_BANK_HEADER_SEARCH_TEST_IDS as TEST_IDS } from '../testIds';

interface SearchProps {
  onSearch: (value: string) => void;
}

const makeStyles = () =>
  makeSxStyles({
    container: {
      padding: 1.5,
      display: 'flex',
      borderRadius: 0.67,
      alignItems: 'center',
      flexDirection: 'row',
      backgroundColor: 'grey.100',
    },
    icon: { marginRight: 1.5, color: 'text.secondary' },
    inputContainer: { flex: '100%' },
    input: { padding: 0 },
  });

const Search: FC<SearchProps> = ({ onSearch }) => {
  const styles = makeStyles();

  const handleOnChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onSearch(event.target.value);
  };

  return (
    <Box sx={styles.container}>
      <SearchIcon sx={styles.icon} />
      <InputBase
        size="small"
        sx={styles.inputContainer}
        onChange={handleOnChange}
        placeholder="Search for question"
        inputProps={{
          sx: styles.input,
          'data-testid': TEST_IDS.SEARCH_INPUT,
        }}
      />
    </Box>
  );
};

export { SearchProps };
export default Search;
