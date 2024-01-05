import React from 'react';
import {
  Box,
  SearchIcon,
  TableCell,
  TableRow,
  Typography,
  makeSxStyles,
} from '@*company-data-covered*/design-system';

const styles = makeSxStyles({
  container: { padding: 6 },
  searchIcon: {
    width: 65,
    height: 65,
    color: (theme) => theme.palette.grey[300],
  },
});

const NoEpisodesRow = React.memo(() => (
  <TableRow data-testid="no-episodes">
    <TableCell align="center" colSpan={5}>
      <Box sx={styles.container}>
        <SearchIcon sx={styles.searchIcon} />
        <Typography
          data-testid="no-episodes-text"
          variant="body2"
          color="text.secondary"
        >
          No episodes found
        </Typography>
      </Box>
    </TableCell>
  </TableRow>
));

export default NoEpisodesRow;
